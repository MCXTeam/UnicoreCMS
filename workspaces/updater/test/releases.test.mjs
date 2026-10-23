import assert from "node:assert/strict";
import { test } from "node:test";
import { generateKeyPairSync, sign } from "node:crypto";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  publishBundle,
  signedManifest,
  unpack,
  parts,
  GitHubReleases,
} from "../src/releases.mjs";
import { managed, hash, safeName, scan } from "../src/files.mjs";
import { compatibility, mergeFile } from "../src/merge.mjs";

test("release downloads reject foreign redirects and never forward API credentials to asset hosts", async () => {
  const original = globalThis.fetch;
  const source = new GitHubReleases({ repository: "MCXTeam/UnicoreCMS", token: "fixture-token" });
  const calls = [];
  try {
    globalThis.fetch = async (url, options) => {
      calls.push({ url, headers: options.headers });
      if (new URL(url).hostname === "api.github.com") return new Response(null, { status: 302, headers: { Location: "https://release-assets.githubusercontent.com/fixture" } });
      return new Response("asset");
    };
    assert.equal((await source.request("https://api.github.com/repos/MCXTeam/UnicoreCMS/releases", 20)).toString(), "asset");
    assert.equal(calls[0].headers.Authorization, "Bearer fixture-token");
    assert.equal(calls[1].headers.Authorization, undefined);
    globalThis.fetch = async () => new Response(null, { status: 302, headers: { Location: "https://untrusted.example.org/file" } });
    await assert.rejects(source.request("https://github.com/fixture", 20), { code: "untrusted_url" });
  } finally { globalThis.fetch = original; }
});

test("release downloads bound redirect chains and response bytes", async () => {
  const original = globalThis.fetch;
  const source = new GitHubReleases({ repository: "MCXTeam/UnicoreCMS" });
  try {
    globalThis.fetch = async () => new Response(null, { status: 302, headers: { Location: "https://github.com/again" } });
    await assert.rejects(source.request("https://github.com/fixture", 20), { code: "redirect_limit" });
    globalThis.fetch = async () => new Response("oversized asset");
    await assert.rejects(source.request("https://github.com/fixture", 3), { code: "download_limit" });
  } finally { globalThis.fetch = original; }
});

import { metadata } from "./helpers.mjs";
test("signed release roundtrip keeps source modules and excludes secrets and data", async () => {
  const root = await mkdtemp(join(tmpdir(), "unicore-release-"));
  try {
    const input = join(root, "input");
    const output = join(root, "output");
    const target = join(root, "target");
    await mkdir(join(input, "workspaces/server/src/modules"), {
      recursive: true,
    });
    await mkdir(join(input, "storage"));
    await writeFile(join(input, ".env"), "secret");
    await writeFile(join(input, ".env.example"), "placeholder");
    await writeFile(
      join(input, "workspaces/server/src/modules/a.ts"),
      "export const value = 1;",
    );
    await writeFile(join(input, "storage/private"), "private");
    const keys = generateKeyPairSync("ed25519");
    const manifest = await publishBundle(
      input,
      output,
      metadata(),
      keys.privateKey,
    );
    assert.ok(manifest.files["workspaces/server/src/modules/a.ts"]);
    assert.ok(manifest.files[".env.example"]);
    assert.equal(manifest.files[".env"], undefined);
    const raw = await readFile(join(output, "unicore-manifest.json"));
    const sig = await readFile(join(output, "unicore-manifest.sig"), "utf8");
    assert.deepEqual(
      signedManifest(raw, sig, {
        test: keys.publicKey.export({ type: "spki", format: "pem" }),
      }),
      manifest,
    );
    assert.throws(
      () =>
        signedManifest(Buffer.concat([raw, Buffer.from(" ")]), sig, {
          test: keys.publicKey.export({ type: "spki", format: "pem" }),
        }),
      { code: "untrusted_release" },
    );
    const bundle = await readFile(join(output, manifest.asset.name));
    await unpack(bundle, manifest, target);
    assert.equal(
      await readFile(
        join(target, "workspaces/server/src/modules/a.ts"),
        "utf8",
      ),
      "export const value = 1;",
    );
    const corrupted = Buffer.from(bundle);
    corrupted[15] ^= 1;
    await assert.rejects(unpack(corrupted, manifest, join(root, "bad")), {
      code: "asset_digest",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("archive paths and data roots are never managed", () => {
  for (const name of ["../x", "/x", "C:/x", "a\\b", "a/../b", "x\0y", "a//b"])
    assert.throws(() => safeName(name));
  for (const name of [
    ".env",
    "storage/a",
    "modules/test/module.json",
    "docker/mysql-data/a",
    "node_modules/x",
    "workspaces/server/dist/main.js",
  ])
    assert.equal(managed(name), false, name);
  for (const name of [
    ".env.example",
    "workspaces/server/src/modules/a.ts",
    "workspaces/server/src/admin/storage/a.ts",
  ])
    assert.equal(managed(name), true, name);
});
test("compatibility checks retained clients and dependency closures", () => {
  const current = metadata().components;
  assert.deepEqual(compatibility(current), []);
  current.server.provides.http = "2";
  assert.ok(compatibility(current).includes("client: http"));
  current.server.dependencySet = "new";
  assert.ok(compatibility(current).includes("dependency_set"));
});
test("three way merge preserves independent modifications and exposes overlapping edits", async () => {
  const root = await mkdtemp(join(tmpdir(), "unicore-merge-"));
  try {
    const b = Buffer.from("a\nb\nc\nd\ne\nf\n");
    const local = Buffer.from("custom\nb\nc\nd\ne\nf\n");
    const target = Buffer.from("a\nb\nc\nd\ne\nnew\n");
    const result = await mergeFile(b, local, target, root);
    assert.equal(result.kind, "merged");
    assert.equal(result.data.toString(), "custom\nb\nc\nd\ne\nnew\n");
    assert.equal(
      (await mergeFile(b, local, Buffer.from("other\nb\nc\nd\ne\nf\n"), root))
        .kind,
      "conflict",
    );
    assert.equal((await mergeFile(b, local, null, root)).kind, "conflict");
    assert.equal((await mergeFile(null, local, target, root)).kind, "conflict");
    assert.equal(
      (await mergeFile(b, Buffer.from([0, 1]), Buffer.from([0, 2]), root)).kind,
      "conflict",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

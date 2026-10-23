import { createPublicKey, sign, verify } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  safeName,
  managed,
  scan,
  hash,
  fail,
  noLinks,
  atomic,
} from "./files.mjs";

export const parts = [
  "server",
  "client",
  "admin",
  "common",
  "api",
  "ui",
  "root",
];
export const component = (name) =>
  name.startsWith("workspaces/") && parts.includes(name.split("/")[1])
    ? name.split("/")[1]
    : "root";
export function validateManifest(m) {
  if (
    m?.format !== 1 ||
    !/^v?\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(m.version) ||
    !/^[a-f0-9]{40}$/.test(m.commit) ||
    !m.components ||
    !m.files ||
    !m.asset ||
    !/^[a-f0-9]{64}$/.test(m.asset.sha256) ||
    !Number.isSafeInteger(m.asset.bytes) ||
    m.asset.bytes < 1 ||
    m.asset.bytes > 256 * 1024 * 1024
  )
    fail("invalid_manifest");
  safeName(m.asset.name);
  if (m.asset.name.includes("/")) fail("invalid_asset");
  for (const part of parts) {
    const c = m.components[part];
    if (
      !c ||
      typeof c.version !== "string" ||
      !c.provides ||
      !c.requires ||
      typeof c.dependencySet !== "string"
    )
      fail("invalid_component");
    for (const [key, ranges] of Object.entries(c.requires))
      if (
        !/^[\w.-]+$/.test(key) ||
        !Array.isArray(ranges) ||
        !ranges.length ||
        ranges.some((v) => typeof v !== "string")
      )
        fail("invalid_contract");
    for (const value of Object.values(c.provides))
      if (typeof value !== "string") fail("invalid_contract");
  }
  if (Object.keys(m.files).length > 50000 || !Object.keys(m.files).length)
    fail("file_limit");
  for (const [name, sha] of Object.entries(m.files)) {
    safeName(name);
    if (
      !managed(name) ||
      !parts.includes(component(name)) ||
      !/^[a-f0-9]{64}$/.test(sha)
    )
      fail("invalid_file", name);
  }
  if (!["compatible", "restore"].includes(m.database?.rollback))
    fail("invalid_database_contract");
  return m;
}
export function signedManifest(raw, signature, keys) {
  if (!Buffer.isBuffer(raw)) raw = Buffer.from(raw);
  if (raw.length > 12 * 1024 * 1024 || typeof signature !== "string")
    fail("manifest_limit");
  const trusted = Object.entries(keys).find(([, key]) => {
    const publicKey = createPublicKey(key);
    return (
      publicKey.asymmetricKeyType === "ed25519" &&
      verify(null, raw, publicKey, Buffer.from(signature.trim(), "base64"))
    );
  });
  if (!trusted) fail("untrusted_release");
  return validateManifest(JSON.parse(raw.toString("utf8")));
}
function octal(buffer, offset, length, value) {
  buffer.write(
    value.toString(8).padStart(length - 1, "0") + "\0",
    offset,
    length,
  );
}
export async function pack(root, names) {
  const chunks = [];
  let bytes = 0;
  for (const name of names) {
    safeName(name);
    const data = await readFile(await noLinks(root, name));
    bytes += data.length;
    if (bytes > 256 * 1024 * 1024) fail("unpacked_limit");
    const header = Buffer.alloc(512);
    const split =
      name.length > 100 ? name.lastIndexOf("/", name.length - 1) : -1;
    if (
      name.length > 100 &&
      (split < 0 || split > 155 || name.length - split - 1 > 100)
    )
      fail("long_path");
    header.write(split < 0 ? name : name.slice(split + 1), 0, 100);
    if (split >= 0) header.write(name.slice(0, split), 345, 155);
    octal(header, 100, 8, 0o644);
    octal(header, 108, 8, 0);
    octal(header, 116, 8, 0);
    octal(header, 124, 12, data.length);
    octal(header, 136, 12, 0);
    header.fill(32, 148, 156);
    header[156] = 48;
    header.write("ustar\0", 257);
    header.write("00", 263);
    octal(
      header,
      148,
      8,
      header.reduce((n, b) => n + b, 0),
    );
    chunks.push(header, data, Buffer.alloc((512 - (data.length % 512)) % 512));
  }
  return gzipSync(Buffer.concat([...chunks, Buffer.alloc(1024)]));
}
export async function unpack(buffer, manifest, destination) {
  if (
    buffer.length !== manifest.asset.bytes ||
    hash(buffer) !== manifest.asset.sha256
  )
    fail("asset_digest");
  const tar = gunzipSync(buffer, { maxOutputLength: 300 * 1024 * 1024 });
  const seen = new Set();
  const folded = new Set();
  await mkdir(destination, { recursive: true, mode: 0o700 });
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const h = tar.subarray(offset, offset + 512);
    if (h.every((b) => b === 0)) break;
    const field = (start, length) =>
      h
        .subarray(start, start + length)
        .toString("utf8")
        .replace(/\0.*$/s, "")
        .trim();
    const expected = parseInt(field(148, 8), 8);
    const check = h.reduce((n, b, i) => n + (i >= 148 && i < 156 ? 32 : b), 0);
    if (
      check !== expected ||
      field(257, 6) !== "ustar" ||
      ![0, 48].includes(h[156])
    )
      fail("unsafe_archive");
    const name = safeName(
      [field(345, 155), field(0, 100)].filter(Boolean).join("/"),
    );
    const length = parseInt(field(124, 12), 8);
    if (
      !Number.isSafeInteger(length) ||
      length < 0 ||
      offset + 512 + length > tar.length ||
      seen.has(name) ||
      folded.has(name.toLowerCase()) ||
      !Object.hasOwn(manifest.files, name)
    )
      fail("unsafe_archive");
    const data = tar.subarray(offset + 512, offset + 512 + length);
    if (hash(data) !== manifest.files[name]) fail("file_digest", name);
    seen.add(name);
    folded.add(name.toLowerCase());
    const path = await noLinks(destination, name);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await writeFile(path, data, { flag: "wx", mode: 0o644 });
    offset += 512 + Math.ceil(length / 512) * 512;
  }
  if (
    seen.size !== Object.keys(manifest.files).length ||
    !tar.subarray(offset).every((b) => b === 0)
  )
    fail("incomplete_archive");
}
export class GitHubReleases {
  constructor(config) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(config.repository))
      fail("invalid_repository");
    this.config = config;
  }
  async request(url, limit, redirects = 0) {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      ![
        "api.github.com",
        "github.com",
        "release-assets.githubusercontent.com",
        "objects.githubusercontent.com",
      ].includes(parsed.hostname) ||
      parsed.username ||
      parsed.password ||
      parsed.port
    )
      fail("untrusted_url");
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(120000),
      headers: {
        "User-Agent": "UnicoreUpdater",
        ...(parsed.hostname === "api.github.com" && this.config.token
          ? { Authorization: `Bearer ${this.config.token}` }
          : {}),
      },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (redirects >= 4) fail("redirect_limit");
      return this.request(
        new URL(response.headers.get("location"), url).href,
        limit,
        redirects + 1,
      );
    }
    if (!response.ok) fail("release_http", `GitHub: ${response.status}`);
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > limit) {
        await response.body.cancel().catch(() => {});
        fail("download_limit");
      }
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  async list() {
    const releases = JSON.parse(
      (
        await this.request(
          `https://api.github.com/repos/${this.config.repository}/releases?per_page=50`,
          2 * 1024 * 1024,
        )
      ).toString(),
    );
    return releases
      .filter(
        (r) =>
          !r.draft &&
          (!r.prerelease || this.config.prereleases) &&
          ["unicore-manifest.json", "unicore-manifest.sig"].every((n) =>
            r.assets?.some((a) => a.name === n),
          ),
      )
      .map((r) => ({
        id: r.tag_name,
        name: r.name || r.tag_name,
        notes: String(r.body || "").slice(0, 16000),
        prerelease: r.prerelease,
      }));
  }
  async get(id, target) {
    if (!/^v?\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(id)) fail("invalid_release");
    const base = `https://github.com/${this.config.repository}/releases/download/${encodeURIComponent(id)}/`;
    const raw = await this.request(
      base + "unicore-manifest.json",
      12 * 1024 * 1024,
    );
    const signature = (
      await this.request(base + "unicore-manifest.sig", 4096)
    ).toString();
    const manifest = signedManifest(raw, signature, this.config.keys);
    if (manifest.version !== id.replace(/^v/, "")) fail("release_identity");
    await unpack(
      await this.request(
        base + encodeURIComponent(manifest.asset.name),
        manifest.asset.bytes,
      ),
      manifest,
      target,
    );
    return manifest;
  }
}
export class DirectoryReleases {
  constructor(config) {
    this.config = config;
  }
  async list() {
    const { readdir } = await import("node:fs/promises");
    return (await readdir(this.config.directory))
      .filter((id) => /^v?\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(id))
      .filter((id) => this.config.prereleases || !id.includes("-"))
      .map((id) => ({ id, name: id }));
  }
  async get(id, target) {
    if (!/^v?\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(id)) fail("invalid_release");
    const root = await noLinks(this.config.directory, id);
    const raw = await readFile(await noLinks(root, "unicore-manifest.json"));
    const signature = await readFile(
      await noLinks(root, "unicore-manifest.sig"),
      "utf8",
    );
    const manifest = signedManifest(raw, signature, this.config.keys);
    if (manifest.version !== id.replace(/^v/, "")) fail("release_identity");
    await unpack(
      await readFile(await noLinks(root, manifest.asset.name)),
      manifest,
      target,
    );
    return manifest;
  }
}
export async function publishBundle(root, output, metadata, privateKey) {
  const files = await scan(root);
  const buffer = await pack(root, Object.keys(files));
  const artifacts = {};
  const { exists } = await import("./files.mjs");
  for (const [part, sub] of [
    ["server", "dist"],
    ["client", ".output"],
    ["admin", ".output"],
  ])
    if (await exists(join(root, "workspaces", part, sub)))
      artifacts[part] = await scan(
        join(root, "workspaces", part, sub),
        (name) => !name.split("/").includes("node_modules"),
      );
  const manifest = validateManifest({
    ...metadata,
    format: 1,
    files,
    artifacts,
    asset: {
      name: "unicore-source.tar.gz",
      bytes: buffer.length,
      sha256: hash(buffer),
    },
  });
  const raw = JSON.stringify(manifest, null, 2);
  await mkdir(output, { recursive: true });
  await atomic(join(output, manifest.asset.name), buffer);
  await atomic(join(output, "unicore-manifest.json"), raw);
  await atomic(
    join(output, "unicore-manifest.sig"),
    sign(null, Buffer.from(raw), privateKey).toString("base64"),
  );
  return manifest;
}

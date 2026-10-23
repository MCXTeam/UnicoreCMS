import assert from "node:assert/strict";
import { test } from "node:test";
import { extensionProblems } from "../src/extensions.mjs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseEnv } from "node:util";
import { LocalExecutor } from "../src/executor.mjs";
import { atomic, json } from "../src/files.mjs";
const { satisfies } = createRequire(import.meta.url)("semver");
const module = (id, requires = {}, unicoreApi = "^1", enabled = true) => ({
  kind: "modules",
  enabled,
  manifest: {
    id,
    version: "1.0.0",
    unicoreApi,
    requires: { modules: requires },
  },
});

test("explicit theme disabling clears only its selection while preserving environment secrets and extension files", async () => {
  const data = await mkdtemp(join(tmpdir(), "unicore-themes-"));
  try {
    await mkdir(join(data, "themes", "custom"), { recursive: true });
    await atomic(join(data, "themes/custom/theme.json"), { id: "custom", unicoreApi: "^2" });
    await atomic(join(data, "themes/state.json"), { active: "custom", client: "custom", admin: "other" });
    await atomic(join(data, ".env"), '# keep\nENCRYPTION_KEY="unchanged"\nUNICORE_THEME="custom"\nUNICORE_ADMIN_THEME="other"\n');
    const executor = new LocalExecutor({ directory: join(data, "state"), root: data, data, database: { envFile: join(data, ".env") }, deployment: { type: "docker", container: "fixture" } });
    await executor.applyDisabled(data, { disabled: ["themes/custom"], extensions: [{ id: "themes/custom", kind: "themes", name: "custom", dependants: [] }] });
    const env = parseEnv(await readFile(join(data, ".env"), "utf8"));
    assert.equal(env.UNICORE_THEME, "");
    assert.equal(env.UNICORE_ADMIN_THEME, "other");
    assert.equal(env.ENCRYPTION_KEY, "unchanged");
    assert.equal((await json(join(data, "themes/state.json"))).active, null);
    assert.equal((await json(join(data, "themes/custom/theme.json"))).id, "custom");
  } finally { await rm(data, { recursive: true, force: true }); }
});

test("incompatible modules cascade through every dependency level, including cycles", () => {
  const records = [
    module("ccc", { bbb: "*" }),
    module("bbb", { aaa: "*", ccc: "*" }),
    module("aaa", {}, "^2"),
  ];
  const result = extensionProblems(records, "1.0.0", satisfies);
  assert.deepEqual(result.map((p) => p.name).sort(), ["aaa", "bbb", "ccc"]);
  assert.deepEqual(result.find((p) => p.name === "aaa").dependants, ["bbb"]);
  assert.deepEqual(result.find((p) => p.name === "bbb").dependants, ["ccc"]);
});

test("missing, disabled and incompatible dependency versions prevent retaining a module", () => {
  const records = [
    module("aaa"),
    module("bbb", {}, "^1", false),
    module("ccc", { aaa: "^2" }),
    module("ddd", { bbb: "*" }),
    module("eee", { absent: "*" }),
    module("fff", { aaa: "^1" }),
  ];
  assert.deepEqual(
    extensionProblems(records, "1.0.0", satisfies)
      .map((p) => p.name)
      .sort(),
    ["ccc", "ddd", "eee"],
  );
});

test("extension validation resolves dependencies from the active installation after switching releases", async () => {
  const data = await mkdtemp(join(tmpdir(), "unicore-active-"));
  try {
    await atomic(join(data, ".env"), "SITENAME=fixture");
    const executor = new LocalExecutor({ root: join(data, "removed-old-release"), data, directory: join(data, "state"), database: { envFile: join(data, ".env") }, deployment: { type: "docker", container: "fixture" } });
    assert.deepEqual(await executor.extensions({ previous: { root: fileURLToPath(new URL("../../../", import.meta.url)) }, components: { api: { version: "1.0.0" } } }), []);
  } finally { await rm(data, { recursive: true, force: true }); }
});

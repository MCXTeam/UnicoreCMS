import assert from "node:assert/strict";
import { test } from "node:test";
import { connectEnvironment } from "../src/setup.mjs";
import { parseEnv } from "node:util";
import { mkdtemp, mkdir, writeFile, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { setup } from "../src/setup.mjs";

test("connecting the runner preserves existing settings and replaces only its credentials", () => {
  const source =
    '# project\nDATABASE_PASSWORD="unchanged"\nexport UNICORE_UPDATER_URL="http://old"\nUNICORE_UPDATER_TOKEN=old\nCUSTOM="value"\n';
  const updated = connectEnvironment(
    source,
    { socketFile: "/private/runner.sock" },
    "new-token",
  );
  const env = parseEnv(updated);
  assert.equal(env.DATABASE_PASSWORD, "unchanged");
  assert.equal(env.CUSTOM, "value");
  assert.equal(env.UNICORE_UPDATER_URL, undefined);
  assert.equal(env.UNICORE_UPDATER_TOKEN, "new-token");
  assert.equal(env.UNICORE_UPDATER_SOCKET, "/private/runner.sock");
  assert.ok(updated.startsWith("# project\n"));
  assert.equal(
    parseEnv(connectEnvironment(updated, { host: "::1", port: 9751 }, "next"))
      .UNICORE_UPDATER_URL,
    "http://[::1]:9751",
  );
});

test("setup installs a standalone runtime and protected credentials without changing unrelated environment", { skip: process.platform !== "linux" }, async () => {
  const folder = await mkdtemp(join(tmpdir(), "unicore-setup-"));
  try {
    const root = join(folder, "site"); const data = join(folder, "data"); const directory = join(folder, "state");
    await mkdir(root); await mkdir(data);
    await writeFile(join(root, "package.json"), '{"version":"1.3.0"}');
    await writeFile(join(data, ".env"), '# keep\nDATABASE_PASSWORD="unchanged"\n');
    const config = { root, data, directory, builderImage: "local:test", database: { envFile: join(data, ".env") }, deployment: { type: "pm2", launcher: join(directory, "launcher.json") }, health: ["http://127.0.0.1:5000"], smoke: [{ port: 5000, path: "/" }], releases: { keys: { local: "fixture" } }, runner: { socketFile: join(directory, "runner.sock") } };
    const result = await setup(config);
    assert.ok((await readFile(result.executable, "utf8")).includes("UpdateCoordinator"));
    const env = parseEnv(await readFile(join(data, ".env"), "utf8"));
    assert.equal(env.DATABASE_PASSWORD, "unchanged");
    assert.equal(env.UNICORE_UPDATER_TOKEN.length, 64);
    assert.equal((await stat(join(directory, "runner-token"))).mode & 0o777, 0o600);
    assert.equal((await stat(result.config)).mode & 0o777, 0o600);
    await assert.rejects(setup(config), { code: "already_configured" });
  } finally { await rm(folder, { recursive: true, force: true }); }
});

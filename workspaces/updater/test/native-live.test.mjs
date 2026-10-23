import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile, readFile, readdir, rm, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { hash, atomic, json } from "../src/files.mjs";
import { NativeMariaDbBackup } from "../src/native-database.mjs";
import { nativeTools } from "../src/native-executor.mjs";
import { startNativeTask, interruptNativeTasks } from "../src/native-tasks.mjs";
import { preparePterodactyl } from "../src/pterodactyl-start.mjs";
import { PterodactylTransition } from "../src/pterodactyl.mjs";

test("native image restores a real database clone, checks it and stops process groups without Docker", { skip: process.env.NATIVE_UPDATER_LIVE_TEST !== "1" }, async (t) => {
  await nativeTools();
  const base = await mkdtemp(join(process.env.TEST_TMPDIR || "/tmp", "native-db-"));
  t.after(() => rm(base, { recursive: true, force: true }));
  const sql = "CREATE TABLE fixture (id INT PRIMARY KEY, value VARCHAR(80)); INSERT INTO fixture VALUES (1,'saved');";
  await writeFile(join(base, "database.sql"), sql);
  const backup = { path: join(base, "database.sql"), sha256: hash(sql), database: "fixture", characterSet: "utf8mb4", collation: "utf8mb4_unicode_ci" };
  const database = new NativeMariaDbBackup({}, base);
  await database.withClone(backup, base, async (clone) => {
    await atomic(join(base, ".env"), `DATABASE_HOST=${clone.host}\nDATABASE_PORT=${clone.port}\nDATABASE_USER=${clone.user}\nDATABASE_PASSWORD=${clone.password}\nDATABASE_NAME=${clone.name}\n`);
    const live = new NativeMariaDbBackup({ envFile: join(base, ".env") }, base);
    await live.preflight();
    assert.equal((await live.query("SELECT value FROM fixture.fixture").catch((error) => { throw new Error(error.diagnostic); })).trim(), "saved");
    const copy = join(base, "copy"); await mkdir(copy);
    const dump = await live.dump(copy);
    await live.withClone(dump, copy, async (restored) => {
      const verified = new NativeMariaDbBackup({ envFile: join(base, ".env"), environment: { DATABASE_PORT: restored.port, DATABASE_PASSWORD: restored.password } }, base);
      assert.equal((await verified.query("SELECT value FROM fixture.fixture")).trim(), "saved");
      await verified.query("UPDATE fixture.fixture SET value='clone only'");
    });
    assert.equal((await live.query("SELECT value FROM fixture.fixture")).trim(), "saved");
  });
  assert(!(await readdir(base)).some((name) => name.startsWith("mysql-")));
  const task = await startNativeTask(base, "hanging", process.execPath, ["-e", "setInterval(()=>{},1000)"]);
  await new Promise((resolve) => setTimeout(resolve, 500));
  await interruptNativeTasks(base);
  await assert.rejects(task.done);
  assert(!(await readdir(join(base, "tasks"))).some((name) => name.endsWith(".pid.json")));
});
test("Pterodactyl bootstrap preserves a legacy site's data and creates state outside managed code", { skip: process.env.NATIVE_UPDATER_LIVE_TEST !== "1" }, async (t) => {
  const base = await mkdtemp(join(process.env.TEST_TMPDIR || "/tmp", "native-bootstrap-"));
  t.after(() => rm(base, { recursive: true, force: true }));
  await writeFile(join(base, ".env"), "DATABASE_HOST=localhost\nDATABASE_USER=fixture\nDATABASE_PASSWORD=private\nDATABASE_NAME=fixture\n");
  const before = hash(await readFile(join(base, ".env")));
  await writeFile(join(base, "package.json"), '{"version":"1.3.0"}');
  for (const side of ["server", "client", "admin"]) {
    const output = join(base, "workspaces", side, side === "server" ? "dist" : ".output");
    await mkdir(output, { recursive: true });
    await writeFile(join(output, "fixture"), "preserved");
  }
  const result = await preparePterodactyl(base);
  assert.equal(result.config.executor, "native");
  assert.equal(result.config.database.containerClient, false);
  assert(!result.directory.startsWith(result.config.root + "/"));
  assert.equal(hash(await readFile(join(base, ".env"))), before);
  assert.equal((await json(join(base, ".unicore-updater.json"))).directory, result.directory);
  assert.equal((await preparePterodactyl(base)).file, result.file);
});
test("panel transition verifies this site's files and rejects another server before making changes", { skip: process.env.NATIVE_UPDATER_LIVE_TEST !== "1" }, async (t) => {
  const base = await mkdtemp("/home/container/transition-");
  t.after(() => rm(base, { recursive: true, force: true }));
  const options = { url: "https://panel.example.org", server: "1234abcd", token: "fixture-token-1234567890" };
  const good = new PterodactylTransition(options, async (url, init) => {
    assert.equal(init.method, "GET");
    return new Response(await readFile(join("/home/container", new URL(url).searchParams.get("file"))));
  });
  await good.verifyData(base);
  assert.deepEqual(await readdir(base), []);
  const wrong = new PterodactylTransition(options, async () => new Response("another site"));
  await assert.rejects(wrong.verifyData(base), { code: "pterodactyl_server_mismatch" });
  assert.deepEqual(await readdir(base), []);
});

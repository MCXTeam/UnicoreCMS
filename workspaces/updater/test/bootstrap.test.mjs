import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, stat, rm, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { configuration, ensureInstallation, installationPaths, readConnection, discovery } from "../src/bootstrap.mjs";
import { managed, hash } from "../src/files.mjs";
import { MariaDbBackup } from "../src/database.mjs";

async function fixture(t) {
  const directory = await mkdtemp(join(process.env.TEST_TMPDIR || tmpdir(), "unicore-bootstrap-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = join(directory, "site");
  await mkdir(join(root, "compat"), { recursive: true });
  await writeFile(join(root, "compat/release-signing-public.pem"), await readFile(new URL("../../../compat/release-signing-public.pem", import.meta.url)));
  await writeFile(join(root, "package.json"), '{"name":"fixture","version":"1.3.0"}');
  await writeFile(join(root, ".env"), 'DATABASE_HOST=127.0.0.1\nDATABASE_NAME=fixture\nDATABASE_USER=fixture\nDATABASE_PASSWORD="private password"\nSERVER_PORT=5050\nCLIENT_PORT=3030\nADMIN_PORT=4040\n');
  return { root, directory };
}

test("defaults derive existing data, actual ports, trusted key and external state without exposing database credentials", async (t) => {
  const { root } = await fixture(t);
  const config = await configuration(root);
  assert.equal(config.data, root);
  assert.equal(config.directory, join(root, "..", ".site-updater"));
  assert.equal(config.database.containerClient, true);
  assert.equal(config.health[0], "http://127.0.0.1:5050/_update/health");
  assert.deepEqual(config.smoke.map((item) => item.port), [5050, 3030, 4040]);
  assert.match(config.releases.keys["unicore-2026-10"], /BEGIN PUBLIC KEY/);
  assert(!JSON.stringify(config).includes("private password"));
  assert(Buffer.byteLength(config.runner.socketFile) < 100);
  const pm2 = await configuration(root, root, { mode: "pm2" });
  assert.deepEqual(pm2.deployment.apps, ["unicore-server", "unicore-client", "unicore-admin"]);
});

test("bootstrap idempotence and concurrency preserve the environment and persistent connection", { skip: process.platform !== "linux" }, async (t) => {
  const { root } = await fixture(t);
  const before = hash(await readFile(join(root, ".env")));
  const results = await Promise.all([ensureInstallation(root), ensureInstallation(root)]);
  const connection = await readConnection(root);
  assert.equal(connection.token.length, 64);
  assert.equal(hash(await readFile(join(root, ".env"))), before);
  assert.equal((await readConnection(root)).token, connection.token);
  assert.equal(results[0].config.runner.tokenFile, results[1].config.runner.tokenFile);
  assert.equal((await stat(join(root, ".unicore-updater.json"))).mode & 0o777, 0o600);
  assert(await stat(join(results[0].paths.directory, "runtime/src/worker.mjs")));
  assert(await stat(join(results[0].paths.directory, "ipc/launcher.json")));
});

test("control and connection files never enter release archives or code comparisons", () => {
  assert.equal(managed(".unicore-updater.json"), false);
  assert.equal(managed(".unicore-updater-setup.json"), false);
  assert.equal(managed(".unicore-updater.json.temporary.tmp"), false);
  assert.equal(managed("workspaces/updater/src/bootstrap.mjs"), true);
});

test("bootstrap reclaims an old container's lock even when its PID has been reused", { skip: process.platform !== "linux" }, async (t) => {
  const { root } = await fixture(t);
  const paths = installationPaths(root);
  await mkdir(paths.directory, { recursive: true });
  await writeFile(join(paths.directory, "bootstrap.lock"), JSON.stringify({ pid: process.pid, identity: "previous-process", boot: "previous-boot" }));
  await ensureInstallation(root);
  assert.equal((await readConnection(root)).token.length, 64);
  assert(!(await readdir(paths.directory)).some((name) => name.endsWith(".claim")));
});

test("database container clients inherit the password without placing it in process arguments", async (t) => {
  const { root, directory } = await fixture(t);
  const database = new MariaDbBackup({ envFile: join(root, ".env"), containerClient: true }, directory);
  const command = database.clientCommand("mariadb", ["--batch"]);
  assert.equal(command.file, "docker");
  assert(command.args.includes("MYSQL_PWD"));
  assert(!command.args.join(" ").includes("private password"));
  assert.equal((await database.clientEnv()).MYSQL_PWD, "private password");
  assert.equal(installationPaths(root).root, root);
});

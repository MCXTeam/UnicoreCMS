import { randomBytes, randomUUID } from "node:crypto";
import { readFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { createServer } from "node:net";
import { MariaDbBackup } from "./database.mjs";
import { atomic, hash, fail } from "./files.mjs";
import { checked } from "./deployment.mjs";
import { nativeEnvironment, startNativeTask, runNativeTask } from "./native-tasks.mjs";

export async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
export class NativeMariaDbBackup extends MariaDbBackup {
  async withClone(backup, folder, task) {
    if (hash(await readFile(backup.path)) !== backup.sha256) fail("backup_digest");
    if (!/^[\w-]+$/.test(backup.database) || ![backup.characterSet, backup.collation].every((value) => /^[a-zA-Z0-9_]+$/.test(value))) fail("database_charset");
    const directory = join(folder, `mysql-${randomUUID()}`);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const secret = randomBytes(24).toString("hex");
    const socket = `/tmp/uc-db-${randomBytes(8).toString("hex")}.sock`;
    const port = await freePort();
    let daemon;
    try {
      await runNativeTask(folder, "database-init", "mariadb-install-db", ["--no-defaults", `--datadir=${directory}`, "--auth-root-authentication-method=normal", "--skip-test-db", "--innodb-buffer-pool-size=64M", "--innodb-flush-log-at-trx-commit=2", "--innodb-doublewrite=0"], { env: nativeEnvironment(), timeout: 300000 });
      const init = join(directory, "init.sql");
      await atomic(init, `ALTER USER 'root'@'localhost' IDENTIFIED BY '${secret}';\nDELETE FROM mysql.global_priv WHERE User='' OR (User='root' AND Host<>'localhost');\nCREATE DATABASE \`${backup.database}\` CHARACTER SET ${backup.characterSet} COLLATE ${backup.collation};\nCREATE USER 'unicore_clone'@'127.0.0.1' IDENTIFIED BY '${secret}';\nGRANT ALL ON \`${backup.database}\`.* TO 'unicore_clone'@'127.0.0.1';\nFLUSH PRIVILEGES;\n`);
      daemon = await startNativeTask(folder, "database", "mariadbd", ["--no-defaults", `--datadir=${directory}`, `--socket=${socket}`, `--pid-file=${join(directory, "server.pid")}`, `--port=${port}`, "--bind-address=127.0.0.1", "--skip-name-resolve", `--init-file=${init}`, "--skip-log-bin", "--event-scheduler=OFF", "--innodb-flush-log-at-trx-commit=2", "--innodb-doublewrite=0", "--innodb-buffer-pool-size=64M", "--max-connections=20", "--performance-schema=OFF", `--log-error=${join(directory, "error.log")}`], { env: nativeEnvironment(), timeout: 3600000 });
      let exited = false;
      daemon.done.finally(() => { exited = true; }).catch(() => {});
      const env = nativeEnvironment({ MYSQL_PWD: secret });
      const args = ["--no-defaults", `--socket=${socket}`, "-uroot"];
      const deadline = Date.now() + (this.config.startupTimeoutMs || 120000);
      let ready = false;
      while (Date.now() < deadline && !exited) {
        ready = await checked("mariadb", [...args, "-e", "SELECT 1"], { env, timeout: 3000 }).then(() => true, () => false);
        if (ready) break;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      if (!ready) fail("backup_restore_timeout");
      const { spawn } = await import("node:child_process");
      const { createReadStream } = await import("node:fs");
      await new Promise((resolve, reject) => {
        const child = spawn("mariadb", [...args, backup.database], { env, stdio: ["pipe", "ignore", "ignore"] });
        const input = createReadStream(backup.path);
        const timer = setTimeout(() => child.kill("SIGKILL"), this.config.restoreTimeout || 600000);
        child.on("error", reject);
        input.on("error", reject);
        child.stdin.on("error", reject);
        child.on("close", (code) => { clearTimeout(timer); input.destroy(); code === 0 ? resolve() : reject(Object.assign(new Error("Clone restore failed"), { code: "backup_restore_failed" })); });
        input.pipe(child.stdin);
      });
      await checked("mariadb-check", [...args, backup.database], { env, timeout: 120000 });
      return await task({ host: "127.0.0.1", port: String(port), name: backup.database, user: "unicore_clone", password: secret });
    } finally {
      await daemon?.stop();
      await rm(directory, { recursive: true, force: true });
      await rm(socket, { force: true });
    }
  }
}

import { randomBytes, randomUUID } from "node:crypto";
import { readFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { parseEnv } from "node:util";
import { docker, checked } from "./deployment.mjs";
import { atomic, hash, fail } from "./files.mjs";

export class MariaDbBackup {
  constructor(config, directory) {
    this.config = config;
    this.directory = directory;
  }
  async settings() {
    const env = { ...parseEnv(await readFile(this.config.envFile, "utf8")), ...this.config.environment };
    const data = {
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT || "3306",
      user: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
      database: env.DATABASE_NAME,
    };
    for (const name of ["host", "user", "password", "database"])
      if (!data[name]) fail("database_configuration");
    if (!/^[\w-]+$/.test(data.database)) fail("database_name");
    return data;
  }
  async clientEnv() {
    const data = await this.settings();
    return { ...process.env, MYSQL_PWD: data.password };
  }
  async connection() {
    const data = await this.settings();
    return [
      "--host",
      data.host,
      "--port",
      data.port,
      "--user",
      data.user,
      "--default-character-set=utf8mb4",
    ];
  }
  clientCommand(name, args) {
    return this.config.containerClient
      ? { file: "docker", args: ["run", "--rm", "-i", "--network", this.config.network || "host", "--env", "MYSQL_PWD", this.config.image || "mariadb:11.8", name, ...args] }
      : { file: name, args };
  }
  async runClient(name, args, options) {
    const command = this.clientCommand(name, args);
    return checked(command.file, command.args, options);
  }
  async dump(folder) {
    const data = await this.settings();
    const [characterSet, collation] = (
      await this.query(
        `SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='${data.database}'`,
      )
    )
      .trim()
      .split(/\s+/);
    if (
      ![characterSet, collation].every((value) =>
        /^[a-zA-Z0-9_]+$/.test(value || ""),
      )
    )
      fail("database_charset");
    const output = await this.runClient(
      this.config.dump || "mariadb-dump",
      [
        ...(await this.connection()),
        "--single-transaction",
        "--routines",
        "--triggers",
        "--events",
        "--hex-blob",
        "--skip-add-locks",
        data.database,
      ],
      {
        env: await this.clientEnv(),
        maxOutput: this.config.maxBytes || 256 * 1024 * 1024,
      },
    );
    await atomic(join(folder, "database.sql"), output);
    return {
      path: join(folder, "database.sql"),
      sha256: hash(output),
      bytes: Buffer.byteLength(output),
      database: data.database,
      characterSet,
      collation,
    };
  }
  async query(sql) {
    return this.runClient(
      this.config.client || "mariadb",
      [
        ...(await this.connection()),
        "--batch",
        "--skip-column-names",
        "--execute",
        sql,
      ],
      { env: await this.clientEnv() },
    );
  }
  async preflight() {
    const data = await this.settings();
    await this.query(
      `SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='${data.database}'`,
    );
    await this.runClient(this.config.dump || "mariadb-dump", ["--version"]);
  }
  async clone(backup, name, network) {
    const timeout = this.config.startupTimeoutMs || 300000;
    if (!Number.isSafeInteger(timeout) || timeout < 1000 || timeout > 600000)
      fail("database_startup_timeout_configuration");
    if (hash(await readFile(backup.path)) !== backup.sha256)
      fail("backup_digest");
    if (!/^[\w-]+$/.test(backup.database)) fail("database_name");
    if (
      [backup.characterSet, backup.collation].some(
        (value) => value && !/^[a-zA-Z0-9_]+$/.test(value),
      )
    )
      fail("database_charset");
    const secret = randomBytes(24).toString("hex");
    const file = join(this.directory, `${name}.env`);
    await atomic(
      file,
      `MARIADB_ROOT_PASSWORD=${secret}\nMARIADB_DATABASE=${backup.database}\n`,
    );
    const data = join(dirname(backup.path), `mysql-${randomUUID()}`);
    await mkdir(data, { recursive: true, mode: 0o700 });
    await docker(
      "run",
      "-d",
      "--name",
      name,
      "--network",
      network,
      "--env-file",
      file,
      "--mount",
      `type=bind,src=${data},dst=/var/lib/mysql`,
      "--mount",
      `type=bind,src=${backup.path},dst=/backup.sql,readonly`,
      this.config.image || "mariadb:11.8",
      ...(backup.characterSet
        ? [`--character-set-server=${backup.characterSet}`]
        : []),
      ...(backup.collation ? [`--collation-server=${backup.collation}`] : []),
      "--event-scheduler=OFF",
    );
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const ready = await checked("docker", [
        "exec",
        "--env",
        `MYSQL_PWD=${secret}`,
        name,
        "mariadb",
        "--protocol=tcp",
        "--host=127.0.0.1",
        "-uroot",
        "-e",
        "SELECT 1",
      ], { timeout: 5000 }).then(
        () => true,
        () => false,
      );
      if (ready) {
        await docker(
          "exec",
          "--env",
          `MYSQL_PWD=${secret}`,
          name,
          "sh",
          "-c",
          'mariadb -uroot "$MARIADB_DATABASE" < /backup.sql',
        );
        await docker(
          "exec",
          "--env",
          `MYSQL_PWD=${secret}`,
          name,
          "mariadb-check",
          "-uroot",
          backup.database,
        );
        return {
          host: name,
          password: secret,
          name: backup.database,
          user: "root",
          port: "3306",
        };
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    fail("backup_restore_timeout");
  }
  async restore(backup) {
    if (
      !backup?.verified ||
      hash(await readFile(backup.path)) !== backup.sha256
    )
      fail("unverified_backup");
    const data = await this.settings();
    const characterSet = backup.characterSet || "utf8mb4";
    const collation = backup.collation;
    if (
      ![characterSet, ...(collation ? [collation] : [])].every((value) =>
        /^[a-zA-Z0-9_]+$/.test(value),
      )
    )
      fail("database_charset");
    await this.query(
      `DROP DATABASE \`${data.database}\`; CREATE DATABASE \`${data.database}\` CHARACTER SET ${characterSet}${collation ? ` COLLATE ${collation}` : ""}`,
    );
    const { spawn } = await import("node:child_process");
    const { createReadStream } = await import("node:fs");
    const args = [...(await this.connection()), data.database];
    const env = await this.clientEnv();
    await new Promise((resolve, reject) => {
      const command = this.clientCommand(this.config.client || "mariadb", args);
      const child = spawn(command.file, command.args, {
        env,
        stdio: ["pipe", "ignore", "ignore"],
        windowsHide: true,
      });
      const input = createReadStream(backup.path);
      const timer = setTimeout(
        () => child.kill("SIGKILL"),
        this.config.restoreTimeout || 600000,
      );
      input.on("error", reject);
      child.on("error", (error) => {
        clearTimeout(timer);
        input.destroy();
        reject(error);
      });
      child.stdin.on("error", reject);
      input.pipe(child.stdin);
      child.on("close", (code) => {
        clearTimeout(timer);
        input.destroy();
        return code === 0
          ? resolve()
          : reject(
              Object.assign(new Error("Database restore failed"), {
                code: "database_restore_failed",
              }),
            );
      });
    });
  }
}

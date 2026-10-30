import { mkdir, readFile, cp, rm, readdir, statfs } from "node:fs/promises";
import { join, dirname } from "node:path";
import { parseEnv } from "node:util";
import { LocalExecutor } from "./executor.mjs";
import { NativeMariaDbBackup, freePort } from "./native-database.mjs";
import { checked } from "./deployment.mjs";
import { atomic, exists, fail } from "./files.mjs";
import { nativeEnvironment, interruptNativeTasks, startNativeTask, runNativeTask } from "./native-tasks.mjs";
import { updateLicenses } from "./licensing.mjs";

export async function nativeCapacity() {
  const meminfo = await readFile("/proc/meminfo", "utf8");
  let available = Number(/MemAvailable:\s+(\d+)/.exec(meminfo)?.[1] || 0) * 1024;
  for (const [limit, current] of [["/sys/fs/cgroup/memory.max", "/sys/fs/cgroup/memory.current"], ["/sys/fs/cgroup/memory/memory.limit_in_bytes", "/sys/fs/cgroup/memory/memory.usage_in_bytes"]]) {
    try {
      const ceiling = Number((await readFile(limit, "utf8")).trim());
      const used = Number((await readFile(current, "utf8")).trim());
      const stats = await readFile(join(dirname(limit), "memory.stat"), "utf8");
      const reclaimable = Number(/^(?:total_)?inactive_file\s+(\d+)/m.exec(stats)?.[1] || 0);
      if (Number.isFinite(ceiling) && ceiling > 0) available = Math.min(available, Math.min(ceiling, ceiling - used + reclaimable));
    } catch {}
  }
  return available;
}
export async function nativeTools() {
  if (process.platform !== "linux") fail("linux_executor_required");
  for (const file of ["git", "pnpm", "mariadb", "mariadbd", "mariadb-dump", "mariadb-check", "make", "g++", "python3"])
    await checked(file, ["--version"], { timeout: 10000 });
  await checked("sh", ["-ec", "command -v mariadb-install-db"], { timeout: 10000 });
}
export class NativeExecutor extends LocalExecutor {
  constructor(config) {
    super(config);
    if (config.deployment.type !== "supervisor") fail("native_supervisor_required");
    this.database = new NativeMariaDbBackup({ ...config.database, containerClient: false }, this.directory);
  }
  async preflight() {
    await nativeTools();
    if (await nativeCapacity() < (this.config.minimumMemoryBytes || 4 * 1024 ** 3) + 256 * 1024 ** 2) fail("insufficient_memory");
    const space = await statfs(this.directory);
    const size = Number((await checked("du", ["-sb", "--exclude=.unicore-updater", this.data])).split(/\s/)[0]);
    if (space.bavail * space.bsize < Math.max(this.config.minimumFreeBytes || 3 * 1024 ** 3, size * 4 + (this.config.database.maxBytes || 256 * 1024 ** 2) * 3)) fail("insufficient_disk");
    await this.database.preflight();
    await this.deployment.preflight();
  }
  async interrupt(op) {
    await interruptNativeTasks(this.folder(op));
    for (const label of ["verify", "backup"]) {
      const folder = join(this.folder(op), label);
      await interruptNativeTasks(folder);
      for (const name of await readdir(folder).catch((error) => error.code === "ENOENT" ? [] : Promise.reject(error)))
        if (/^mysql-[a-f0-9-]{36}$/.test(name)) await rm(join(folder, name), { recursive: true, force: true });
    }
  }
  async clone(op, label, task) {
    const folder = join(this.folder(op), label);
    await mkdir(folder, { recursive: true, mode: 0o700 });
    const backup = await this.database.dump(folder);
    return this.database.withClone(backup, folder, (db) => task({ db, backup, folder }));
  }
  async build(op, root) {
    await this.interrupt(op);
    await this.buildEnvironment(op, root);
    const licensing = await updateLicenses(this.config, root, op);
    try {
    const store = join(this.directory, "package-store");
    await mkdir(store, { recursive: true });
    if (process.env.COREPACK_HOME && !(await exists(join(store, "corepack"))))
      await cp(process.env.COREPACK_HOME, join(store, "corepack"), { recursive: true });
    const env = nativeEnvironment({ ...licensing.env, UNICORE_DATA_ROOT: root, UNICORE_CODE_ROOT: root, CI: "true", COREPACK_HOME: join(store, "corepack"), XDG_CACHE_HOME: join(store, "cache"), npm_config_nodedir: "/usr/local", NODE_OPTIONS: "--max-old-space-size=3072", UNICORE_BUILD_MEMORY_BYTES: String(4 * 1024 ** 3) });
    const task = (name, args) => runNativeTask(this.folder(op), name, "pnpm", args, { cwd: root, env });
    await task("install", ["install", "--frozen-lockfile", `--store-dir=${store}`, "--fetch-retries=0", "--fetch-timeout=30000"]);
    await task("build", ["run", "build"]);
    for (const side of ["server", "admin", "client"]) await task(`types-${side}`, ["--filter", `unicore-${side}`, "run", "typecheck"]);
    await task("contracts", ["--filter", "unicore-api", "run", "api:check"]);
    for (const [part, output] of [["server", "dist"], ["client", ".output"], ["admin", ".output"]])
      if (!op.selected.includes(part)) {
        const original = join(op.previous.root, "workspaces", part, output);
        if (await exists(original)) {
          await rm(join(root, "workspaces", part, output), { recursive: true, force: true });
          await cp(original, join(root, "workspaces", part, output), { recursive: true });
        }
      }
    } finally { licensing.close(); }
  }
  async verify(op, root) {
    await this.build(op, root);
    const licensing = await updateLicenses(this.config, root, op);
    try {
    await this.clone(op, "verify", async ({ db, folder }) => {
      const data = join(folder, "data");
      await this.copyShared(data, op);
      await this.sandboxEnv(op, data, db, data);
      const ports = { server: await freePort(), client: await freePort(), admin: await freePort() };
      const env = { ...parseEnv(await readFile(join(data, ".env"), "utf8")), ...licensing.env, UNICORE_CODE_ROOT: root,
        SERVER_PORT: String(ports.server), BACKEND_PORT: String(ports.server), CLIENT_PORT: String(ports.client), ADMIN_PORT: String(ports.admin),
        BASEURL: `http://127.0.0.1:${ports.client}`, API_BASEURL: `http://127.0.0.1:${ports.server}`, ADMIN_BASEURL: `http://127.0.0.1:${ports.admin}`,
        UNICORE_UPDATE_HOLD_FILE: join(data, "hold"), UNICORE_UPDATER_EXTERNAL: "1", NODE_PATH: join(root, "node_modules") };
      await atomic(join(data, ".env"), Object.entries(env).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join("\n"));
      const tasks = [];
      let exited = false;
      try {
        for (const side of ["server", "client", "admin"]) {
          const task = await startNativeTask(this.folder(op), `smoke-${side}`, process.execPath, [side === "server" ? "dist/main.js" : "start.mjs"], { cwd: join(root, "workspaces", side), env: nativeEnvironment(env) });
          task.done.finally(() => { exited = true; }).catch(() => {});
          tasks.push(task);
        }
        for (const [side, path] of [["server", "/_update/health"], ["client", "/"], ["admin", "/updates"]]) {
          const deadline = this.startupDeadline();
          let ready = false;
          while (!exited && Date.now() < deadline) {
            ready = await fetch(`http://127.0.0.1:${ports[side]}${path}`, { signal: AbortSignal.timeout(2000), redirect: "error" }).then((response) => response.ok, () => false);
            if (ready) break;
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
          if (!ready) fail(exited ? "sandbox_exited" : "smoke_failed");
        }
        await this.migration(op, root, data, env);
      } finally { await Promise.all(tasks.map((task) => task.stop())); }
    });
    } finally { licensing.close(); }
  }
  async migration(op, root, data, environment) {
    const licensing = await updateLicenses(this.config, root, op);
    try {
    const env = nativeEnvironment({ ...environment, ...licensing.env, UNICORE_DATA_ROOT: data, UNICORE_CODE_ROOT: root, MIGRATIONS_SKIP: "false", NODE_PATH: join(root, "node_modules") });
    await runNativeTask(this.folder(op), "migrate", process.execPath, [join(root, "workspaces/server/dist/migrations/cli.js"), "apply"], { cwd: root, env });
    } finally { licensing.close(); }
  }
  async migrate(op) {
    return this.migration(op, join(this.folder(op), "candidate"), this.data, parseEnv(await readFile(this.config.database.envFile, "utf8")));
  }
}

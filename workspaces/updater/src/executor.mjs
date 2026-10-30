import {
  mkdir,
  readFile,
  cp,
  rm,
  readdir,
  statfs,
  lstat,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { parseEnv } from "node:util";
import { freemem } from "node:os";
import {
  atomic,
  optionalJson,
  exists,
  digest,
  scan,
  fail,
} from "./files.mjs";
import {
  docker,
  checked,
  processOwner,
  DockerDeployment,
  Pm2Deployment,
  PterodactylDeployment,
  SupervisorDeployment,
} from "./deployment.mjs";
import { extensionProblems } from "./extensions.mjs";
import { MariaDbBackup } from "./database.mjs";
import { assembleImage } from "./images.mjs";
import { runTask, interruptTasks, taskName, ownMount } from "./tasks.mjs";
import { dockerEnvironment } from "./environment.mjs";
import { command } from "./merge.mjs";
import { updateLicenses } from "./licensing.mjs";

export class LocalExecutor {
  constructor(config) {
    this.config = config;
    this.directory = resolve(config.directory);
    this.data = resolve(config.data);
    this.control = join(this.directory, "ipc");
    this.database = new MariaDbBackup(config.database, this.directory);
    const options = config.deployment;
    this.deployment =
      options.type === "docker"
        ? new DockerDeployment(options, this.directory)
        : options.type === "pm2"
          ? new Pm2Deployment(options)
          : options.type === "pterodactyl"
            ? new PterodactylDeployment(options)
            : options.type === "supervisor"
              ? new SupervisorDeployment(options)
              : fail("unsupported_deployment");
  }
  folder(op) {
    return join(this.directory, "operations", op.id);
  }
  async removeCloneData(op, label) {
    const folder = join(this.folder(op), label);
    const entries = await readdir(folder).catch((error) =>
      error.code === "ENOENT" ? [] : Promise.reject(error),
    );
    for (const entry of entries) {
      if (!/^mysql-[a-f0-9-]{36}$/.test(entry)) continue;
      const path = join(folder, entry);
      if ((await lstat(path)).isDirectory())
        await ownMount(op.id, `type=bind,src=${path},dst=/owned`, this.config.builderImage);
      await rm(path, { recursive: true, force: true });
    }
  }
  async interrupt(op) {
    await interruptTasks(op.id);
    const networks = new Set(
      (await docker("network", "ls", "--format", "{{.Name}}")).trim().split("\n"),
    );
    for (const label of ["verify", "backup"]) {
      await this.removeCloneData(op, label);
      const network = `${taskName(op.id, label)}-net`;
      if (networks.has(network)) await docker("network", "rm", network);
    }
  }
  startupDeadline() {
    const timeout = this.config.startupTimeoutMs || 300000;
    if (!Number.isSafeInteger(timeout) || timeout < 1000 || timeout > 600000) fail("startup_timeout_configuration");
    return Date.now() + timeout;
  }
  context(hold = true) {
    return { data: this.data, hold, holdFile: join(this.control, "hold") };
  }
  async fingerprint(root = this.config.root) {
    return digest({
      environment: await readFile(this.config.database.envFile, "utf8"),
      extensions: await this.extensionSnapshot(),
      artifacts: await this.runtimeFiles(root),
      config: this.config,
    });
  }
  async runtimeFiles(root) {
    const result = {};
    for (const [part, path] of [
      ["server", "dist"],
      ["client", ".output"],
      ["admin", ".output"],
    ]) {
      const directory = join(root, "workspaces", part, path);
      if (await exists(directory))
        result[part] = await scan(
          directory,
          (name) => !name.split("/").includes("node_modules"),
        );
    }
    return result;
  }
  async artifacts(op, root) {
    const files = await this.runtimeFiles(root);
    return Object.entries(files)
      .filter(([part]) => op.selected.includes(part))
      .filter(([part, index]) => {
        const expected = (op.previous.artifacts ||
          op.previous.manifest.artifacts)?.[part];
        return !expected || digest(expected) !== digest(index);
      })
      .map(([part]) => ({ part, accepted: false }));
  }
  async extensionSnapshot() {
    const result = {};
    for (const kind of ["modules", "themes"])
      if (await exists(join(this.data, kind)))
        result[kind] = await scan(
          join(this.data, kind),
          (name) =>
            !name
              .split("/")
              .some((p) =>
                ["node_modules", ".git", ".nuxt", ".output"].includes(p),
              ),
        );
    return result;
  }
  async candidateFingerprint(op) {
    return digest({
      tree: await scan(
        join(this.folder(op), "candidate"),
        (name) =>
          !name
            .split("/")
            .some((p) =>
              ["node_modules", ".git", "storage", ".nuxt"].includes(p),
            ),
      ),
      image: op.image
        ? JSON.parse(await docker("image", "inspect", op.image))[0].Id
        : null,
    });
  }
  async extensions(op) {
    const { satisfies } = createRequire(join(op.previous.root, "package.json"))(
      "semver",
    );
    const api = op.components.api.version;
    const modules = await optionalJson(
      join(this.data, "modules/state.json"),
      {},
    );
    const themes = await optionalJson(join(this.data, "themes/state.json"), {});
    if (!themes.client && themes.active) themes.client = themes.active;
    const env = parseEnv(await readFile(this.config.database.envFile, "utf8"));
    if (env.UNICORE_THEME) themes.client = env.UNICORE_THEME;
    if (env.UNICORE_ADMIN_THEME) themes.admin = env.UNICORE_ADMIN_THEME;
    const records = [];
    for (const kind of ["modules", "themes"]) {
      const root = join(this.data, kind);
      for (const folder of await readdir(root, { withFileTypes: true }).catch(
        (e) => (e.code === "ENOENT" ? [] : Promise.reject(e)),
      )) {
        if (!folder.isDirectory()) continue;
        const manifest = await optionalJson(
          join(
            root,
            folder.name,
            kind === "modules" ? "module.json" : "theme.json",
          ),
          null,
        );
        if (!manifest) continue;
        records.push({
          kind,
          manifest,
          enabled:
            kind === "modules"
              ? modules[manifest.id]?.enabled !== false
              : Object.values(themes).includes(manifest.id),
        });
      }
    }
    return extensionProblems(records, api, satisfies);
  }
  async preflight() {
    if (
      !this.config.builderImage ||
      !this.config.health?.length ||
      !this.config.smoke?.length ||
      !this.config.database?.envFile ||
      !(await exists(this.data))
    )
      fail("executor_configuration");
    if (process.platform !== "linux") fail("linux_executor_required");
    const memory = /^(\d+)([mg])$/.exec(this.config.memory || "4g");
    const available =
      Number(
        /MemAvailable:\s+(\d+)/.exec(
          await readFile("/proc/meminfo", "utf8"),
        )?.[1] || 0,
      ) * 1024 || freemem();
    if (
      !memory ||
      available <
        Number(memory[1]) * (memory[2] === "g" ? 1024 ** 3 : 1024 ** 2) +
          512 * 1024 ** 2
    )
      fail("insufficient_memory");
    const daemon = JSON.parse(await docker("info", "--format", "{{json .}}"));
    const backing =
      this.config.dockerBackingPath ||
      (!String(daemon.OperatingSystem).includes("Docker Desktop")
        ? daemon.DockerRootDir
        : null);
    if (!backing) fail("docker_backing_path_required");
    await docker("image", "inspect", this.config.builderImage);
    await docker(
      "run",
      "--rm",
      "--network=none",
      "--mount",
      `type=bind,src=${backing},dst=/disk,readonly`,
      this.config.builderImage,
      "node",
      "-e",
      `const s=require('fs').statfsSync('/disk');if(s.bavail*s.bsize<${Number(this.config.minimumDockerFreeBytes || 3 * 1024 ** 3)})process.exit(2)`,
    );
    await this.database.preflight();
    await this.deployment.preflight();
    const space = await statfs(this.directory);
    const size = Number(
      (await checked("du", ["-sb", this.data])).split(/\s/)[0],
    );
    if (
      space.bavail * space.bsize <
      Math.max(
        this.config.minimumFreeBytes || 2 * 1024 * 1024 * 1024,
        size * 4 + (this.config.database.maxBytes || 256 * 1024 * 1024) * 3,
      )
    )
      fail("insufficient_disk");
  }
  async copyShared(target, op, includeStorage = true) {
    await mkdir(target, { recursive: true });
    for (const kind of includeStorage
      ? ["modules", "themes", "storage"]
      : ["modules", "themes"])
      if (await exists(join(this.data, kind)))
        await cp(join(this.data, kind), join(target, kind), {
          recursive: true,
          dereference: false,
          filter: (path) =>
            !path
              .split(/[\\/]/)
              .some((p) => [".git", ".nuxt", ".output"].includes(p)),
        });
    await this.applyDisabled(target, op);
  }
  async applyDisabled(root, op) {
    const state = await optionalJson(join(root, "modules/state.json"), {});
    const themes = await optionalJson(join(root, "themes/state.json"), {});
    for (const id of op.disabled) {
      const problem = op.extensions.find((e) => e.id === id);
      if (problem.dependants.some((d) => !op.disabled.includes(`modules/${d}`)))
        fail("dependent_extension");
      if (problem.kind === "modules")
        state[problem.name] = { ...state[problem.name], enabled: false };
      else
        for (const key of Object.keys(themes))
          if (themes[key] === problem.name) themes[key] = null;
    }
    await atomic(join(root, "modules/state.json"), state);
    await atomic(join(root, "themes/state.json"), themes);
    if (
      resolve(root) === this.data &&
      op.disabled.some((id) => id.startsWith("themes/"))
    ) {
      const original = await readFile(this.config.database.envFile, "utf8");
      const env = parseEnv(original);
      const keys = ["UNICORE_THEME", "UNICORE_ADMIN_THEME"].filter((key) =>
        op.disabled.includes(`themes/${env[key]}`),
      );
      if (keys.length)
        await atomic(
          this.config.database.envFile,
          original
            .split(/\r?\n/)
            .map((line) => {
              const key = /^\s*(?:export\s+)?([A-Z_]+)\s*=/.exec(line)?.[1];
              return keys.includes(key) ? `${key}=""` : line;
            })
            .join("\n"),
        );
    }
  }
  async clone(op, label, task) {
    const name = `unicore-${label}-${op.id}`;
    const network = `${name}-net`;
    const folder = join(this.folder(op), label);
    await mkdir(folder, { recursive: true, mode: 0o700 });
    await docker("network", "create", "--internal", network);
    try {
      const backup = await this.database.dump(folder);
      const db = await this.database.clone(backup, name, network);
      return await task({ db, backup, network, folder });
    } finally {
      const removed = await docker("rm", "-f", name).then(
        () => true,
        () => false,
      );
      if (removed) await this.removeCloneData(op, label);
      await docker("network", "rm", network).catch(() => {});
    }
  }
  async sandboxEnv(op, folder, db, dataPath = "/data") {
    const env = parseEnv(await readFile(this.config.database.envFile, "utf8"));
    Object.assign(env, {
      DATABASE_HOST: db.host,
      DATABASE_PORT: db.port,
      DATABASE_USER: db.user,
      DATABASE_PASSWORD: db.password,
      DATABASE_NAME: db.name,
      MIGRATIONS_SKIP: "false",
      UNICORE_DATA_ROOT: dataPath,
      UNICORE_CODE_ROOT: "/app",
      BACKEND_PORT: "5000",
      SERVER_PORT: "5000",
      CLIENT_PORT: "3000",
      ADMIN_PORT: "4000",
      UNICORE_UPDATE_HOLD_FILE: "/data/hold",
      UNICORE_UPDATE_SANDBOX: "1",
      UNICORE_UPDATER_URL: "",
      UNICORE_UPDATER_TOKEN: "",
      API_HTTPS: "false",
    });
    for (const [key, kind] of [
      ["UNICORE_THEME", "themes"],
      ["UNICORE_ADMIN_THEME", "themes"],
    ])
      if (op.disabled.includes(`${kind}/${env[key]}`)) env[key] = "";
    Object.assign(env, {
      BASEURL: "http://127.0.0.1:3000",
      API_BASEURL: "http://127.0.0.1:5000",
      ADMIN_BASEURL: "http://127.0.0.1:4000",
    });
    await atomic(
      join(folder, ".env"),
      Object.entries(env)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join("\n"),
    );
    await atomic(join(folder, "hold"), "1");
    return join(folder, ".env");
  }
  async buildEnvironment(op, root) {
    await this.copyShared(root, op, false);
    const buildEnv = (await exists(join(root, ".env.example")))
      ? parseEnv(await readFile(join(root, ".env.example"), "utf8"))
      : {};
    const realEnv = parseEnv(
      await readFile(this.config.database.envFile, "utf8"),
    );
    for (const key of [
      "UNICORE_THEME",
      "UNICORE_ADMIN_THEME",
      "COLOR_MODE_PREFERENCE",
      "COLOR_MODE_FALLBACK",
      "GOOGLE_ANALYTICS_ID",
      "YANDEX_METRIKA_ID",
    ])
      if (realEnv[key] !== undefined) buildEnv[key] = realEnv[key];
    for (const key of ["UNICORE_THEME", "UNICORE_ADMIN_THEME"])
      if (op.disabled.includes(`themes/${buildEnv[key]}`)) buildEnv[key] = "";
    await atomic(
      join(root, ".env"),
      Object.entries(buildEnv)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join("\n"),
    );
  }
  async build(op, root) {
    await interruptTasks(op.id);
    await this.buildEnvironment(op, root);
    const licensing = await updateLicenses(this.config, root, op, true);
    try {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_./:@-]*$/.test(this.config.builderImage))
      fail("invalid_image");
    const cache = join(this.folder(op), "dependencies");
    await mkdir(cache, { recursive: true });
    for (const file of [
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      "package.json",
    ])
      if (await exists(join(root, file)))
        await cp(join(root, file), join(cache, file));
    for (const part of await readdir(join(root, "workspaces"), {
      withFileTypes: true,
    }))
      if (
        part.isDirectory() &&
        (await exists(join(root, "workspaces", part.name, "package.json")))
      ) {
        await mkdir(join(cache, "workspaces", part.name), { recursive: true });
        await cp(
          join(root, "workspaces", part.name, "package.json"),
          join(cache, "workspaces", part.name, "package.json"),
        );
      }
    if (await exists(join(root, "patches")))
      await cp(join(root, "patches"), join(cache, "patches"), {
        recursive: true,
      });
    const store = `unicore-store-${digest(this.directory).slice(0, 12)}-${digest(await readFile(join(root, "pnpm-lock.yaml"), "utf8")).slice(0, 12)}`;
    if (this.config.storeDirectory)
      await mkdir(this.config.storeDirectory, { recursive: true });
    else await docker("volume", "create", store);
    const storeMount = this.config.storeDirectory
      ? `type=bind,src=${this.config.storeDirectory},dst=/store`
      : `type=volume,src=${store},dst=/store`;
    if (!this.config.storeDirectory)
      await ownMount(op.id, `type=volume,src=${store},dst=/owned`, this.config.builderImage);
    {
      await runTask(op.id, "fetch", [
        "--user",
        processOwner(),
        "--cap-drop=ALL",
        "--security-opt=no-new-privileges",
        "--memory",
        this.config.memory || "4g",
        "--env",
        "COREPACK_HOME=/store/corepack",
        "--env",
        "HOME=/store/home",
        "--env",
        "XDG_CACHE_HOME=/store/cache",
        "--mount",
        `type=bind,src=${cache},dst=/deps`,
        "--mount",
        storeMount,
        "--workdir",
        "/deps",
        this.config.builderImage,
        "pnpm",
        "install",
        "--ignore-scripts",
        "--frozen-lockfile",
        "--store-dir=/store",
        "--fetch-retries=0",
        "--fetch-timeout=30000",
      ]);
      await runTask(op.id, "build", [
        ...licensing.docker,
        "--user",
        processOwner(),
        "--network=none",
        "--cap-drop=ALL",
        "--security-opt=no-new-privileges",
        "--memory",
        this.config.memory || "4g",
        "--env",
        "CI=true",
        "--env",
        "COREPACK_HOME=/store/corepack",
        "--env",
        "HOME=/store/home",
        "--env",
        "XDG_CACHE_HOME=/store/cache",
        "--env",
        "npm_config_nodedir=/usr/local",
        "--mount",
        `type=bind,src=${root},dst=/app`,
        "--mount",
        storeMount,
        "--workdir",
        "/app",
        this.config.builderImage,
        "sh",
        "-ec",
        "pnpm install --offline --frozen-lockfile --store-dir=/store --fetch-retries=0 --fetch-timeout=15000; pnpm run build; pnpm --filter unicore-server run typecheck; pnpm --filter unicore-admin run typecheck; pnpm --filter unicore-client run typecheck; pnpm --filter unicore-api run api:check",
      ], { timeout: 3600000 });
    }
    for (const [part, output] of [
      ["server", "dist"],
      ["client", ".output"],
      ["admin", ".output"],
    ])
      if (!op.selected?.includes(part) && op.previous) {
        const original = join(op.previous.root, "workspaces", part, output);
        if (await exists(original)) {
          await rm(join(root, "workspaces", part, output), {
            recursive: true,
            force: true,
          });
          await cp(original, join(root, "workspaces", part, output), {
            recursive: true,
          });
        }
      }
    if (this.config.deployment.bindCode) {
      op.image = this.config.builderImage;
      return;
    }
    op.image = `unicore-candidate:${op.id}`;
    await assembleImage(root, this.config.builderImage, op.image);
    } finally { licensing.close(); }
  }
  async verify(op, root) {
    await this.build(op, root);
    const licensing = await updateLicenses(this.config, root, op, true);
    try {
    await this.clone(op, "verify", async ({ db, network, folder }) => {
      const data = join(folder, "data");
      await this.copyShared(data, op);
      await this.sandboxEnv(op, data, db);
      const environment = await dockerEnvironment(join(data, ".env"), join(folder, "docker.env"));
      const container = `unicore-check-${op.id}`;
      try {
        await checked("docker", [
          "run",
          "-d",
          "--init",
          "--user",
          processOwner(),
          "--name",
          container,
          "--network",
          network,
          "--cap-drop=ALL",
          "--security-opt=no-new-privileges",
          "--memory",
          this.config.memory || "4g",
          ...licensing.docker,
          ...environment.args,
          "--env",
          "NODE_PATH=/app/node_modules",
          "--mount",
          `type=bind,src=${data},dst=/data`,
          ...(this.config.deployment.bindCode
            ? ["--mount", `type=bind,src=${root},dst=/app,readonly`]
            : []),
          op.image,
          "pnpm",
          "run",
          "start",
        ], { env: environment.env });
        for (const check of this.config.smoke) {
          if (
            !check.path?.startsWith("/") ||
            ![3000, 4000, 5000].includes(check.port)
          )
            fail("invalid_smoke");
          const script = `fetch(${JSON.stringify(`http://127.0.0.1:${check.port}${check.path}`)}, {signal:AbortSignal.timeout(2000)}).then(r=>{if(r.status!==${Number(check.status || 200)})process.exit(1)}).catch(()=>process.exit(1))`;
          let success = false;
          const deadline = this.startupDeadline();
          while (Date.now() < deadline) {
            if (
              await checked("docker", ["exec", container, "node", "-e", script], { timeout: 5000 }).then(
                () => true,
                () => false,
              )
            ) {
              success = true;
              break;
            }
            const state = JSON.parse(await docker("inspect", "--format", "{{json .State}}", container));
            if (["exited", "dead"].includes(state.Status)) {
              const logs = await command("docker", ["logs", "--tail", "100", container]);
              throw Object.assign(new Error("Sandbox exited"), {
                code: "sandbox_exited",
                diagnostic: logs.output.toString() + logs.errors,
              });
            }
            await new Promise((r) => setTimeout(r, 500));
          }
          if (!success) fail("smoke_failed");
        }
        await docker(
          "exec",
          container,
          "node",
          "workspaces/server/dist/migrations/cli.js",
          "apply",
        );
      } finally {
        await docker("rm", "-f", container).catch(() => {});
      }
    });
    } finally { licensing.close(); }
  }
  async quiesce(op) {
    await atomic(join(this.control, "hold"), op.id);
    await this.deployment.stop(op);
  }
  async backup(op) {
    return this.clone(op, "backup", async ({ backup }) => {
      const shared = join(this.folder(op), "shared-backup");
      await mkdir(shared, { recursive: true });
      await atomic(
        join(shared, ".env"),
        await readFile(this.config.database.envFile),
      );
      for (const kind of ["modules", "themes", "storage"])
        if (await exists(join(this.data, kind)))
          await cp(join(this.data, kind), join(shared, kind), {
            recursive: true,
          });
      return { ...backup, shared, verified: true };
    });
  }
  async migrate(op) {
    const licensing = await updateLicenses(this.config, join(this.folder(op), 'candidate'), op, true);
    try {
    const env = this.config.database.envFile;
    const environment = await dockerEnvironment(env, join(this.folder(op), "migration.env"));
    await runTask(op.id, "migrate", [
      ...licensing.docker,
      "--user",
      processOwner(),
      "--network",
      this.config.database.network || "bridge",
      ...environment.args,
      "--env",
      "UNICORE_CODE_ROOT=/app",
      "--env",
      "UNICORE_DATA_ROOT=/data",
      "--env",
      "MIGRATIONS_SKIP=false",
      "--env",
      "NODE_PATH=/app/node_modules",
      ...(this.config.deployment.bindCode
        ? [
            "--mount",
            `type=bind,src=${join(this.folder(op), "candidate")},dst=/app,readonly`,
          ]
        : []),
      "--mount",
      `type=bind,src=${this.data},dst=/data`,
      op.image,
      "node",
      "workspaces/server/dist/migrations/cli.js",
      "apply",
    ], { env: environment.env });
    } finally { licensing.close(); }
  }
  async activate(op) {
    await this.applyDisabled(this.data, op);
    await this.deployment.activate(
      join(this.folder(op), "candidate"),
      this.context(),
      op,
    );
  }
  async check() {
    for (const url of this.config.health) {
      const u = new URL(url);
      if (!["http:", "https:"].includes(u.protocol)) fail("health_url");
      let ok = false;
      const deadline = this.startupDeadline();
      while (Date.now() < deadline) {
        if (
          await fetch(url, {
            signal: AbortSignal.timeout(2000),
            redirect: "error",
          }).then(
            (r) => r.ok,
            () => false,
          )
        ) {
          ok = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      if (!ok) fail("health_failed");
    }
  }
  async open(op) {
    await rm(join(this.control, "hold"), { force: true });
    await this.deployment.open(
      join(this.folder(op), "candidate"),
      this.context(false),
      op,
    );
    await this.check();
  }
  async recover(op, options) {
    await this.interrupt(op);
    if (this.deployment.stopForRecovery) await this.deployment.stopForRecovery(op);
    else await this.deployment.stop(op);
    if (options.restoreDatabase) await this.database.restore(op.backup);
    if (op.backup?.shared) {
      await atomic(
        this.config.database.envFile,
        await readFile(join(op.backup.shared, ".env")),
      );
      for (const kind of ["modules", "themes", "storage"])
        if (await exists(join(op.backup.shared, kind))) {
          await rm(join(this.data, kind), { recursive: true, force: true });
          await cp(join(op.backup.shared, kind), join(this.data, kind), {
            recursive: true,
          });
        }
    }
    await rm(join(this.control, "hold"), { force: true });
    if (this.deployment.recover) await this.deployment.recover(op);
    else await this.deployment.open(op.previous.root, this.context(false), op);
    await this.check();
  }
}

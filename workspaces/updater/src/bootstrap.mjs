import { access, mkdir, readFile, open, unlink, lstat } from "node:fs/promises";
import { constants } from "node:fs";
import { join, resolve } from "node:path";
import { parseEnv } from "node:util";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { atomic, json, optionalJson, exists, fail } from "./files.mjs";
import { checked } from "./deployment.mjs";
import { setup } from "./setup.mjs";
import paths from "./paths.cjs";

export const connectionFile = (data) => join(data, ".unicore-updater.json");
export const setupFile = (data) => join(data, ".unicore-updater-setup.json");
export const installationPaths = paths;
export async function readConnection(data) {
  const file = connectionFile(data);
  if (!(await exists(file))) return null;
  const info = await lstat(file);
  if (!info.isFile() || info.size > 16384 || (process.platform !== "win32" && (info.mode & 0o077))) fail("connection_permissions");
  const value = await json(file);
  if (typeof value.token !== "string" || value.token.length < 32 || !value.socketFile || !value.directory) fail("connection_configuration");
  return value;
}
export async function configuration(root, data = root, options = {}) {
  const paths = installationPaths(root, data, options.directory);
  const env = { ...parseEnv(await readFile(join(paths.data, ".env"), "utf8")), ...options.environment };
  const port = (key, fallback) => {
    const value = Number(env[key] || fallback);
    if (!Number.isInteger(value) || value < 1 || value > 65535) fail("setup_ports");
    return value;
  };
  const backend = port("BACKEND_PORT", env.SERVER_PORT || 5000);
  const ports = [backend, port("CLIENT_PORT", 3000), port("ADMIN_PORT", 4000)];
  const key = await readFile(join(paths.root, "compat/release-signing-public.pem"), "utf8");
  return {
    root: paths.root, data: paths.data, directory: paths.directory,
    builderImage: options.builderImage || "unicore-updater-builder:local",
    memory: "4g", storeDirectory: join(paths.directory, "package-store"),
    database: { envFile: join(paths.data, ".env"), image: "mariadb:11.8", containerClient: true, network: options.network || "host", ...(options.database || {}) },
    deployment: options.deployment || (options.mode === "pm2"
      ? { type: "pm2", apps: ["unicore-server", "unicore-client", "unicore-admin"], launcher: paths.launcher }
      : { type: "supervisor", directory: join(paths.directory, "ipc") }),
    health: [`http://127.0.0.1:${backend}/_update/health`],
    smoke: ports.map((port, index) => ({ port, path: index === 0 ? "/_update/health" : index === 2 ? "/updates" : "/" })),
    runner: { socketFile: join(tmpdir(), `${workerName(paths.data)}.sock`), ...options.runner },
    releases: { repository: "MCXTeam/UnicoreCMS", keys: { "unicore-2026-10": key } },
    ...(options.health ? { health: options.health } : {}),
  };
}
export async function ensureInstallation(root, data = root, options = {}) {
  if (process.platform !== "linux") fail("linux_executor_required");
  const paths = installationPaths(root, data, options.directory);
  await mkdir(paths.directory, { recursive: true, mode: 0o700 });
  const lockFile = join(paths.directory, "bootstrap.lock");
  let lock;
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      lock = await open(lockFile, "wx", 0o600);
      await lock.writeFile(String(process.pid));
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      const pid = Number(await readFile(lockFile, "utf8"));
      if (pid > 0) {
        try { process.kill(pid, 0); } catch (failure) {
          if (failure.code === "ESRCH") await unlink(lockFile).catch(() => {});
        }
      }
      await new Promise((done) => setTimeout(done, 250));
    }
  }
  if (!lock) fail("setup_busy");
  try {
    const file = join(paths.directory, "config.json");
    let config = await optionalJson(file, null);
    if (!config) {
      config = await configuration(root, data, options);
      await setup(config, { writeEnvironment: false, reuseRuntime: true });
    }
    if (resolve(config.data) !== paths.data || resolve(config.directory) !== paths.directory) fail("setup_configuration");
    const token = (await readFile(config.runner.tokenFile, "utf8")).trim();
    await atomic(connectionFile(paths.data), { socketFile: config.runner.socketFile, token, directory: paths.directory });
    if (config.deployment.type === "supervisor" && !(await exists(join(paths.directory, "ipc/launcher.json"))))
      await atomic(join(paths.directory, "ipc/launcher.json"), { root: config.root, data: config.data });
    return { config, file, paths };
  } finally {
    await lock.close();
    await unlink(lockFile);
  }
}
export async function ensureBuilder(config) {
  await checked("docker", ["info", "--format", "{{.ServerVersion}}"], { timeout: 15000 }).catch(() => fail("docker_unavailable"));
  if (!(await checked("docker", ["image", "inspect", config.builderImage], { timeout: 15000 }).then(() => true, () => false)))
    await checked("docker", ["build", "-t", config.builderImage, "-f", join(config.root, "docker/updater/Dockerfile"), config.root], { timeout: 1200000 });
}
export async function discovery(root, data, environment = process.env) {
  const connection = await readConnection(data);
  const state = await optionalJson(setupFile(data), null);
  const linux = process.platform === "linux";
  const external = environment.UNICORE_UPDATER_EXTERNAL === "1" && connection;
  let docker = null;
  if (external) {
    if (state?.state === "ready" || state?.error === "builder_unavailable") docker = true;
    else if (state?.error === "docker_unavailable") docker = false;
  } else {
    docker = linux && await checked("docker", ["info", "--format", "{{.ServerVersion}}"], { timeout: 5000 }).then(() => true, () => false);
  }
  const managed = environment.UNICORE_UPDATER_MANAGED === "1";
  const pm2 = environment.pm_id !== undefined;
  const mode = managed ? "managed" : pm2 ? "pm2" : await exists("/.dockerenv") ? "container" : "manual";
  const writable = await access(data, constants.W_OK).then(() => true, () => false);
  return { mode, checks: { linux, docker, writable }, canConnect: linux && writable && (managed || pm2) && docker,
    state: state?.state || (connection ? "starting" : "discovered"), error: state?.error,
    command: !managed && !pm2 ? "pnpm start" : undefined,
    hostCommand: mode === "container" ? "docker compose --profile prod up -d --build" : undefined };
}
export const workerName = (data) => `unicore-updater-${createHash("sha256").update(resolve(data)).digest("hex").slice(0, 10)}`;

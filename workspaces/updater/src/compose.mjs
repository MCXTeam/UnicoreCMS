import { join, resolve } from "node:path";
import { mkdir, cp, stat, chown, chmod, lstat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { ensureInstallation, installationPaths } from "./bootstrap.mjs";
import { checked } from "./deployment.mjs";
import { exists, managed, atomic, json } from "./files.mjs";

const root = resolve(process.env.UNICORE_INSTALL_ROOT);
const data = root;
const paths = installationPaths(root, data);
const container = process.env.UNICORE_APP_CONTAINER || "unicorecms";
let app;
for (let i = 0; i < 180; i++) {
  app = await checked("docker", ["inspect", container], { timeout: 10000 }).then((result) => JSON.parse(result)[0], () => null);
  if (app?.State.Running) break;
  await new Promise((done) => setTimeout(done, 1000));
}
if (!app?.State.Running) throw Error("application_unavailable");
if (process.getuid?.() === 0) {
  const uid = Number(process.env.UNICORE_APP_UID || await checked("docker", ["exec", container, "node", "-p", "process.getuid()"]));
  const gid = Number(process.env.UNICORE_APP_GID || await checked("docker", ["exec", container, "node", "-p", "process.getgid()"]));
  if (![uid, gid].every((value) => Number.isSafeInteger(value) && value >= 0)) throw Error("application_user");
  const socket = await stat("/var/run/docker.sock");
  for (const name of ["", "storage", "logs", "modules", "themes"]) {
    const path = join(data, name);
    await mkdir(path, { recursive: true });
    const entry = await lstat(path);
    if (!entry.isDirectory() || entry.isSymbolicLink()) throw Error("data_permissions");
    await chown(path, -1, gid);
    await chmod(path, entry.mode | 0o2070);
  }
  const env = join(data, ".env");
  if (!(await lstat(env)).isFile()) throw Error("environment_permissions");
  await chown(env, -1, gid);
  await chmod(env, 0o640);
  await mkdir(paths.directory, { recursive: true, mode: 0o700 });
  await chown(paths.directory, uid, gid);
  await mkdir(join(paths.directory, "ipc"), { recursive: true, mode: 0o700 });
  await chown(join(paths.directory, "ipc"), uid, gid);
  process.env.HOME = join(paths.directory, "home");
  await mkdir(process.env.HOME, { recursive: true, mode: 0o700 });
  await chown(process.env.HOME, uid, gid);
  process.setgroups([socket.gid]);
  process.setgid(gid);
  process.setuid(uid);
}
const network = Object.keys(app.NetworkSettings.Networks)[0];
const initial = join(paths.directory, "initial");
if (!(await exists(join(paths.directory, "config.json")))) {
  await mkdir(initial, { recursive: true });
  await cp(root, initial, { recursive: true, filter: (file) => {
    const relative = file.slice(root.length + 1).replaceAll("\\", "/");
    return file === root || managed(relative);
  } });
  for (const [side, artifact] of [["server", "dist"], ["client", ".output"], ["admin", ".output"]]) {
    await mkdir(join(initial, "workspaces", side), { recursive: true });
    await checked("docker", ["cp", "--archive", `${container}:/usr/local/app/workspaces/${side}/${artifact}`, join(initial, "workspaces", side, artifact)]);
  }
}
const argumentsList = ["--network", network, "--env", "UNICORE_UPDATER_EXTERNAL=1", "--env", "DATABASE_HOST=mariadb", "--env", "UNICORE_UPDATER_CONNECTION_FILE=/updater/connection.json"];
for (const [port, bindings] of Object.entries(app.HostConfig.PortBindings || {}))
  for (const binding of bindings || []) argumentsList.push("-p", `${binding.HostIp || "127.0.0.1"}:${binding.HostPort}:${port}`);
for (const host of app.HostConfig.ExtraHosts || []) argumentsList.push("--add-host", host);
const { file, config } = await ensureInstallation(initial, data, {
  network, environment: { DATABASE_HOST: "mariadb" }, database: { environment: { DATABASE_HOST: "mariadb" } },
  deployment: { type: "docker", container, arguments: argumentsList, user: app.Config.User || "0:0" },
  runner: { socketFile: "/ipc/runner.sock" },
  health: [`http://${container}:${process.env.BACKEND_PORT || process.env.SERVER_PORT || 5000}/_update/health`],
});
await atomic(join(paths.directory, "ipc/connection.json"), { socketFile: "/updater/runner.sock", token: (await json(join(data, ".unicore-updater.json"))).token, directory: paths.directory });
process.argv[2] = file;
await import(pathToFileURL(join(paths.directory, "runtime/src/worker.mjs")).href);

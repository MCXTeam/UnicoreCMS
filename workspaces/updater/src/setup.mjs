import { cp, mkdir, readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { atomic, exists, fail, json } from "./files.mjs";
import { launcherState } from "./deployment.mjs";

export function connectEnvironment(text, connection, token) {
  const clean = text
    .split(/\r?\n/)
    .filter(
      (line) =>
        !/^\s*(?:export\s+)?UNICORE_UPDATER_(?:URL|SOCKET|TOKEN)\s*=/.test(
          line,
        ),
    )
    .join("\n")
    .replace(/\n*$/, "\n");
  const key = connection.socketFile
    ? "UNICORE_UPDATER_SOCKET"
    : "UNICORE_UPDATER_URL";
  const host =
    connection.host === "::1" ? "[::1]" : connection.host || "127.0.0.1";
  const value =
    connection.socketFile || `http://${host}:${connection.port || 9751}`;
  return `${clean}${key}=${JSON.stringify(value)}\nUNICORE_UPDATER_TOKEN=${JSON.stringify(token)}\n`;
}

export async function setup(config, { writeEnvironment = true, reuseRuntime = false } = {}) {
  if (process.platform !== "linux") fail("linux_executor_required");
  for (const key of ["root", "data", "directory"]) {
    if (!isAbsolute(config[key] || "")) fail("absolute_paths_required");
    config[key] = resolve(config[key]);
  }
  const rel = relative(config.root, config.directory);
  if (!rel || (!rel.startsWith("..") && !isAbsolute(rel)))
    fail("state_inside_application");
  if (
    !config.database?.envFile ||
    !isAbsolute(config.database.envFile) ||
    !config.releases?.keys ||
    !Object.keys(config.releases.keys).length
  )
    fail("setup_configuration");
  if (
    !config.builderImage ||
    !["pm2", "docker", "pterodactyl", "supervisor"].includes(
      config.deployment?.type,
    )
  )
    fail("setup_configuration");
  if (!config.health?.length || !config.smoke?.length)
    fail("setup_configuration");
  const runner = (config.runner ||= {});
  if (
    !runner.socketFile &&
    !["127.0.0.1", "::1"].includes(runner.host || "127.0.0.1")
  )
    fail("runner_configuration");
  const destination = join(config.directory, "runtime");
  if ((await exists(destination)) && !reuseRuntime) fail("already_configured");
  const env = await readFile(config.database.envFile, "utf8");
  await json(join(config.root, "package.json"));
  await mkdir(join(config.directory, "ipc"), { recursive: true, mode: 0o700 });
  const source = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  await cp(join(source, "src"), join(destination, "src"), { recursive: true });
  await cp(join(source, "package.json"), join(destination, "package.json"));
  runner.tokenFile = join(config.directory, "runner-token");
  const token = randomBytes(32).toString("hex");
  await atomic(runner.tokenFile, token);
  if (config.deployment.launcher)
    await atomic(
      config.deployment.launcher,
      launcherState(config.deployment, config.root, {
        data: config.data,
        holdFile: join(config.directory, "ipc/hold"),
        hold: false,
      }),
    );
  const file = join(config.directory, "config.json");
  await atomic(file, config);
  if (writeEnvironment)
    await atomic(config.database.envFile, connectEnvironment(env, runner, token));
  return {
    config: file,
    executable: join(destination, "src/cli.mjs"),
    launcher: join(destination, "src/launcher.mjs"),
  };
}

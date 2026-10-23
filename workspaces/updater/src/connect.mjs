import { join, resolve } from "node:path";
import { ensureInstallation, setupFile, workerName } from "./bootstrap.mjs";
import { checked } from "./deployment.mjs";
import { atomic, json } from "./files.mjs";
import { unlink } from "node:fs/promises";

const [root, data] = process.argv.slice(2).map((value) => resolve(value));
try {
  await atomic(setupFile(data), { state: "connecting" });
  const processes = JSON.parse(await checked("pm2", ["jlist"], { timeout: 15000 }));
  const apps = ["server", "client", "admin"].map((side) => {
    const matches = processes.filter((item) => item.name === `unicore-${side}` && [root, join(root, "workspaces", side)].includes(resolve(item.pm2_env.pm_cwd)));
    const item = matches[0];
    if (matches.length !== 1 || item.pm2_env.exec_mode !== "fork_mode") throw Object.assign(new Error(), { code: "pm2_apps_required" });
    return { side, process: item };
  });
  const keep = (item) => Object.fromEntries([
    "node_args", "max_memory_restart", "max_restarts", "min_uptime", "kill_timeout", "listen_timeout", "wait_ready",
    "restart_delay", "exp_backoff_restart_delay", "cron_restart", "namespace", "merge_logs", "log_date_format", "time", "autorestart",
  ].filter((key) => item.pm2_env[key] !== undefined).map((key) => [key, item.pm2_env[key]]));
  const { config, file, paths } = await ensureInstallation(root, data, { mode: "pm2" });
  const marker = join(paths.directory, "adopting");
  await unlink(join(paths.directory, "adoption-failed")).catch((error) => { if (error.code !== "ENOENT") throw error; });
  await atomic(marker, "1");
  const name = workerName(data);
  if (!processes.some((item) => item.name === name || item.name === "unicore-updater"))
    await checked("pm2", ["start", join(paths.directory, "runtime/src/worker.mjs"), "--name", name, "--", file]);
  const specification = join(paths.directory, "pm2-adoption.json");
  const rollback = join(paths.directory, "pm2-original.json");
  await atomic(rollback, { apps: apps.map(({ process: item }) => ({
    ...keep(item),
    name: item.name, cwd: item.pm2_env.pm_cwd, script: item.pm2_env.pm_exec_path,
    args: item.pm2_env.args || [], interpreter: item.pm2_env.exec_interpreter,
    env: item.pm2_env.env, autorestart: item.pm2_env.autorestart,
  })) });
  await atomic(specification, { apps: apps.map(({ side, process: item }) => ({
    ...keep(item),
    name: item.name, cwd: root, script: join(paths.directory, "runtime/src/launcher.mjs"),
    args: [paths.launcher, side], interpreter: process.execPath,
    env: { ...item.pm2_env.env, UNICORE_CODE_ROOT: config.root, UNICORE_DATA_ROOT: data },
    autorestart: true, kill_timeout: item.pm2_env.kill_timeout || 15000,
  })) });
  await new Promise((done) => setTimeout(done, 1500));
  async function healthy() {
    const targets = [...config.health, ...config.smoke.filter((item) => item.path !== '/_update/health').map((item) => `http://127.0.0.1:${item.port}${item.path}`)];
    const deadline = Date.now() + (config.startupTimeoutMs || 300000);
    while (Date.now() < deadline) {
      const results = await Promise.all(targets.map((url) => fetch(url, { signal: AbortSignal.timeout(5000), redirect: "manual" }).then(async (response) => {
        const ok = response.status >= 200 && response.status < 400;
        if (url.endsWith('/_update/health')) return ok && (await response.json()).ready === true;
        await response.body?.cancel();
        return ok;
      }).catch(() => false)));
      if (results.every(Boolean)) return;
      await new Promise((done) => setTimeout(done, 1000));
    }
    throw Object.assign(new Error(), { code: "setup_health_failed" });
  }
  try {
    for (const { process: item } of apps) await checked("pm2", ["delete", String(item.pm_id)]);
    await checked("pm2", ["start", specification]);
    await healthy();
    await checked("pm2", ["save"]);
  } catch (error) {
    await atomic(join(paths.directory, "adoption-failed"), "1");
    for (const { process: item } of apps) await checked("pm2", ["delete", item.name]).catch(() => {});
    await checked("pm2", ["start", rollback]);
    await healthy();
    throw error;
  } finally {
    await unlink(specification);
    await unlink(rollback);
    await unlink(marker);
  }
} catch (error) {
  await atomic(setupFile(data), { state: "attention", error: ["pm2_apps_required", "EACCES"].includes(error.code) ? error.code : "setup_failed" });
  process.exitCode = 1;
}

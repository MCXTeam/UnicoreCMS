import { spawn } from "node:child_process";
import { writeSync } from "node:fs";
import { readFile, readdir, rm, open, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { atomic, json, exists, fail } from "./files.mjs";
import { signalGroup, groupAlive, waitGroupStopped, processScope } from "./process-groups.mjs";

export function nativeEnvironment(extra = {}) {
  const env = {};
  for (const key of ["PATH", "HOME", "LANG", "LC_ALL", "TZ", "TMPDIR", "SSL_CERT_FILE", "SSL_CERT_DIR", "COREPACK_HOME"])
    if (process.env[key] !== undefined) env[key] = process.env[key];
  return { ...env, ...extra };
}
export async function stopNativeTask(file) {
  if (!(await exists(file))) return;
  const entry = await json(file);
  if (entry.scope && entry.scope !== await processScope()) { await rm(file, { force: true }); return; }
  const identity = await readFile(`/proc/${entry.pid}/stat`, "utf8").then(
    (raw) => raw.slice(raw.lastIndexOf(")") + 2).split(" ")[19], () => null);
  if ((identity === entry.identity || (identity === null && await groupAlive(entry.pid))) && entry.pid > 1) {
    signalGroup(entry.pid, "SIGTERM");
    await new Promise((done) => setTimeout(done, 500));
    signalGroup(entry.pid, "SIGKILL");
    await waitGroupStopped(entry.pid);
  }
  await rm(file, { force: true });
}
export async function interruptNativeTasks(folder, accept = () => true) {
  const entries = () => readdir(join(folder, "tasks")).catch((error) => error.code === "ENOENT" ? [] : Promise.reject(error));
  for (const name of await entries())
    if (accept(name) && name.endsWith(".spec.json")) await rm(join(folder, "tasks", name), { force: true });
  for (const name of await entries())
    if (accept(name) && name.endsWith(".pid.json")) await stopNativeTask(join(folder, "tasks", name));
}
export async function startNativeTask(folder, name, file, args, { cwd, env = nativeEnvironment(), timeout = 3600000 } = {}) {
  if (!/^[a-z0-9-]+$/.test(name)) fail("invalid_task");
  const base = join(folder, "tasks", name);
  await mkdir(join(folder, "tasks"), { recursive: true, mode: 0o700 });
  const previous = new RegExp(`^${name}(?:-[a-f0-9-]{36})?\\.(?:pid|spec)\\.json$`);
  await interruptNativeTasks(folder, (entry) => previous.test(entry));
  const instance = `${base}-${randomUUID()}`;
  const registry = `${instance}.pid.json`;
  const specification = `${instance}.spec.json`;
  await atomic(specification, { file, args, cwd, env });
  const output = await open(`${base}.log`, "w", 0o600);
  const child = spawn(process.execPath, [fileURLToPath(new URL("./native-child.mjs", import.meta.url)), registry, specification], {
    detached: true, env: nativeEnvironment(), stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  let bytes = 0;
  const append = (chunk) => {
    bytes += chunk.length;
    try {
      if (bytes > 32 * 1024 ** 2) throw new Error("output_limit");
      writeSync(output.fd, chunk);
    } catch { void stop(); }
  };
  child.stdout.on("data", append);
  child.stderr.on("data", append);
  let timer;
  const done = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(Object.assign(new Error("Native task failed"), { code: "native_task_failed", diagnosticFile: `${base}.log` }));
    });
  }).finally(async () => {
    await output.close();
    await stopNativeTask(registry);
    await rm(specification, { force: true });
  });
  done.catch(() => {});
  const stop = async () => {
    await stopNativeTask(registry);
    if (child.exitCode === null && child.signalCode === null && child.pid) {
      try { process.kill(-child.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
    }
    await done.catch(() => {});
  };
  timer = setTimeout(() => void stop(), timeout);
  return { done, stop };
}
export async function runNativeTask(...args) {
  const task = await startNativeTask(...args);
  try { await task.done; } catch (error) {
    if (error.diagnosticFile) error.diagnostic = (await readFile(error.diagnosticFile, "utf8")).slice(-32000);
    throw error;
  }
}

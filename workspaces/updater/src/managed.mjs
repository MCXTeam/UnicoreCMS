import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { ensureInstallation, setupFile } from "./bootstrap.mjs";
import { atomic } from "./files.mjs";

const root = resolve(process.argv[2]);
const data = resolve(process.env.UNICORE_DATA_ROOT || root);
const children = [];
let stopping = false;
async function stop(code) {
  if (stopping) return;
  stopping = true;
  await Promise.all(children.map((child) => new Promise((done) => {
    if (child.exitCode !== null || !child.pid) return done();
    child.once("exit", done);
    child.kill("SIGTERM");
    setTimeout(() => { child.kill("SIGKILL"); done(); }, 20000).unref();
  })));
  process.exit(code);
}
function start(file, args, env = process.env) {
  const child = spawn(process.execPath, [file, ...args], { env, stdio: "inherit" });
  children.push(child);
  child.on("error", () => void stop(1));
  child.on("exit", () => { if (!stopping) void stop(1); });
}
function startDirect() {
  for (const side of ["server", "client", "admin"]) {
    const child = spawn(process.execPath, [side === "server" ? "dist/main.js" : "start.mjs"], {
      cwd: join(root, "workspaces", side), stdio: "inherit", env: process.env });
    children.push(child);
    child.on("error", () => void stop(1));
    child.on("exit", () => { if (!stopping) void stop(1); });
  }
}
if (process.platform === "linux" && process.env.UNICORE_UPDATER_EXTERNAL !== "1") {
  try {
    const { paths, file } = await ensureInstallation(root, data);
    const runtime = join(paths.directory, "runtime/src");
    start(join(runtime, "worker.mjs"), [file]);
    start(join(runtime, "supervisor.mjs"), [join(paths.directory, "ipc")], { ...process.env, UNICORE_UPDATER_MANAGED: "1" });
  } catch {
    await atomic(setupFile(data), { state: "attention", error: "setup_host_required" }).catch(() => {});
    startDirect();
  }
} else {
  if (process.platform !== "linux") await atomic(setupFile(data), { state: "attention", error: "linux_executor_required" }).catch(() => {});
  startDirect();
}
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => void stop(0));

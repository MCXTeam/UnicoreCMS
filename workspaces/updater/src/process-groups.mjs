import { readdir, readFile, readlink } from "node:fs/promises";
import { fail } from "./files.mjs";

let scope;
export const processScope = () => scope ||= Promise.all([
  readFile("/proc/sys/kernel/random/boot_id", "utf8"), readlink("/proc/self/ns/pid"),
]).then(([boot, namespace]) => `${boot.trim()}:${namespace}`);

export function signalGroup(pid, value) {
  if (!Number.isSafeInteger(pid) || pid <= 1) fail("invalid_process");
  try { process.kill(-pid, value); } catch (error) { if (error.code !== "ESRCH") throw error; }
}
export async function groupAlive(pid) {
  for (const name of await readdir("/proc")) {
    if (!/^\d+$/.test(name)) continue;
    const raw = await readFile(`/proc/${name}/stat`, "utf8").catch((error) => ["ENOENT", "ESRCH", "EACCES"].includes(error.code) ? null : Promise.reject(error));
    if (!raw) continue;
    const fields = raw.slice(raw.lastIndexOf(")") + 2).split(" ");
    if (Number(fields[2]) === pid && !["Z", "X"].includes(fields[0])) return true;
  }
  return false;
}
export async function waitGroupStopped(pid, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (await groupAlive(pid)) {
    if (Date.now() > deadline) fail("process_stop_failed");
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

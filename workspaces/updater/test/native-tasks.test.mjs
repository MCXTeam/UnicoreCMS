import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { startNativeTask, runNativeTask, interruptNativeTasks, stopNativeTask } from "../src/native-tasks.mjs";

test("native cancellation stops descendants and bounded output cannot fill the hosting disk", { skip: process.platform !== "linux" }, async (t) => {
  const base = await mkdtemp(join(process.env.TEST_TMPDIR || tmpdir(), "native-tasks-"));
  t.after(() => rm(base, { recursive: true, force: true }));
  const task = await startNativeTask(base, "descendants", process.execPath, ["-e", `const {spawn}=require('node:child_process');const fs=require('node:fs');process.on('SIGTERM',()=>{});const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"]);fs.writeFileSync(${JSON.stringify(join(base, "child.pid"))},String(child.pid));setInterval(()=>{},1000)`]);
  let pid;
  for (let index = 0; index < 100; index++) {
    try { pid = Number(await readFile(join(base, "child.pid"), "utf8")); break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert(pid);
  await task.stop();
  const state = await readFile(`/proc/${pid}/stat`, "utf8").then((raw) => raw.slice(raw.lastIndexOf(")") + 2).split(" ")[0], () => null);
  assert([null, "Z"].includes(state));
  await assert.rejects(runNativeTask(base, "verbose", process.execPath, ["-e", "setInterval(()=>process.stdout.write('x'.repeat(1024*1024)),5)"], { timeout: 10000 }), { code: "native_task_failed" });
  assert((await readFile(join(base, "tasks/verbose.log"))).length <= 32 * 1024 ** 2);
});
test("a registry from a previous PID namespace cannot stop a new process with the same PID", { skip: process.platform !== "linux" }, async (t) => {
  const base = await mkdtemp(join(process.env.TEST_TMPDIR || tmpdir(), "native-scope-"));
  const child = spawn(process.execPath, ["-e", "setInterval(()=>{},1000)"], { detached: true, stdio: "ignore" });
  t.after(async () => {
    if (child.exitCode === null) {
      const stopped = new Promise((resolve) => child.once("exit", resolve));
      child.kill("SIGKILL");
      await stopped;
    }
    await rm(base, { recursive: true, force: true });
  });
  const file = join(base, "old.pid.json");
  await writeFile(file, JSON.stringify({ pid: child.pid, identity: "old-start", scope: "previous-namespace" }));
  await stopNativeTask(file);
  assert.equal(child.exitCode, null);
  process.kill(child.pid, 0);
});
test("interruption before process registration prevents a pending native task from starting later", { skip: process.platform !== "linux" }, async (t) => {
  const base = await mkdtemp(join(process.env.TEST_TMPDIR || tmpdir(), "native-cancel-"));
  t.after(() => rm(base, { recursive: true, force: true }));
  const marker = join(base, "unexpected");
  const task = await startNativeTask(base, "pending", process.execPath, ["-e", `setTimeout(()=>require('node:fs').writeFileSync(${JSON.stringify(marker)},'started'),1000)`]);
  await interruptNativeTasks(base);
  await task.done.catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 1100));
  await assert.rejects(readFile(marker), { code: "ENOENT" });
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { atomic, json } from "../src/files.mjs";
import { SupervisorDeployment } from "../src/deployment.mjs";
import { groupAlive } from "../src/process-groups.mjs";

test("supervisor stops whole application groups before acknowledging maintenance", { skip: process.platform !== "linux" }, async (t) => {
  const base = await mkdtemp(join(process.env.TEST_TMPDIR || tmpdir(), "native-supervisor-"));
  const directory = join(base, "ipc"), root = join(base, "site");
  await mkdir(directory, { recursive: true });
  for (const side of ["server", "client", "admin"]) {
    const folder = join(root, "workspaces", side, side === "server" ? "dist" : "");
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, side === "server" ? "main.js" : "start.mjs"), side === "server"
      ? `import('node:child_process').then(({spawn})=>{const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"]);require('node:fs').writeFileSync(${JSON.stringify(join(base, "child.pid"))},String(child.pid))});setInterval(()=>{},1000)`
      : "setInterval(()=>{},1000)");
  }
  await atomic(join(directory, "launcher.json"), { root, data: base });
  const child = spawn(process.execPath, [fileURLToPath(new URL("../src/supervisor.mjs", import.meta.url)), directory], { stdio: "ignore" });
  t.after(async () => {
    if (child.exitCode === null) { child.kill("SIGTERM"); await new Promise((resolve) => child.once("exit", resolve)); }
    await rm(base, { recursive: true, force: true });
  });
  let status;
  for (let index = 0; index < 100; index++) {
    try { status = await json(join(directory, "supervisor-status.json")); await readFile(join(base, "child.pid")); if (status.children.length === 3) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(status.children.length, 3);
  const deployment = new SupervisorDeployment({ directory });
  await deployment.preflight();
  await deployment.stop();
  for (const pid of status.children) assert.equal(await groupAlive(pid), false);
  assert.deepEqual((await json(join(directory, "supervisor-status.json"))).children, []);
});

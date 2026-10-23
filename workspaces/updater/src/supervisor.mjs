#!/usr/bin/env node
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { atomic, json, optionalJson, exists, fail } from "./files.mjs";

const directory = resolve(process.argv[2]);
let children = [];
let current;
let busy = false;
let desired = false;
let restartTimer;
const stop = async () => {
  desired = false;
  clearTimeout(restartTimer);
  restartTimer = undefined;
  const active = children;
  children = [];
  await Promise.all(
    active.map((child) =>
      child.exitCode !== null
        ? Promise.resolve()
        : new Promise((resolve) => {
            child.once("exit", resolve);
            child.kill("SIGTERM");
            setTimeout(() => {
              child.kill("SIGKILL");
              resolve();
            }, 15000).unref();
          }),
    ),
  );
};
async function start(root, data) {
  if (!root || !data) fail("supervisor_configuration");
  const hold = join(directory, "hold");
  const env = {
    ...process.env,
    NODE_PATH: join(root, "node_modules"),
    UNICORE_CODE_ROOT: root,
    UNICORE_DATA_ROOT: data,
    UNICORE_UPDATE_HOLD_FILE: hold,
  };
  children = ["server", "client", "admin"].map((name) =>
    spawn(
      process.execPath,
      [name === "server" ? "dist/main.js" : "start.mjs"],
      { cwd: join(root, "workspaces", name), env, stdio: "inherit" },
    ),
  );
  desired = true;
  for (const child of children) {
    const restart = () => {
      if (!desired || restartTimer) return;
      restartTimer = setTimeout(async () => { await stop(); await start(root, data); }, 1000);
    };
    child.on("error", restart);
    child.on("exit", restart);
  }
}
process.on("SIGTERM", () => void stop().then(() => process.exit(0)));
process.on("SIGINT", () => void stop().then(() => process.exit(0)));
const initial = await json(join(directory, "launcher.json"));
if (!(await exists(join(directory, "hold"))))
  await start(initial.root, initial.data);
setInterval(async () => {
  if (busy) return;
  busy = true;
  try {
    const input = await optionalJson(
      join(directory, "supervisor-command.json"),
      null,
    );
    if (input && input.id !== current) {
      await stop();
      if (input.action === "start") {
        await atomic(join(directory, "launcher.json"), {
          root: input.root,
          data: input.data,
        });
        await start(input.root, input.data);
      } else if (input.action !== "stop") fail("invalid_command");
      current = input.id;
    }
    await atomic(join(directory, "supervisor-status.json"), {
      protocol: 1,
      at: Date.now(),
      command: current,
      children: children.map((c) => c.pid),
    });
  } catch (e) {
    await atomic(join(directory, "supervisor-status.json"), {
      protocol: 1,
      at: Date.now(),
      command: current,
      error: e.code || "supervisor_failed",
    });
  } finally {
    busy = false;
  }
}, 1000);

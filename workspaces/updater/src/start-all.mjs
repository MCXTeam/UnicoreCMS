#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const children = [];
let stopping = false;
async function stop(code) {
  if (stopping) return;
  stopping = true;
  await Promise.all(
    children.map((child) =>
      child.exitCode !== null
        ? Promise.resolve()
        : new Promise((done) => {
            child.once("exit", done);
            child.kill("SIGTERM");
            setTimeout(() => {
              child.kill("SIGKILL");
              done();
            }, 20000).unref();
          }),
    ),
  );
  process.exit(code);
}
for (const side of ["server", "client", "admin"]) {
  const child = spawn(
    process.execPath,
    [
      fileURLToPath(new URL("./launcher.mjs", import.meta.url)),
      process.argv[2],
      side,
    ],
    { stdio: "inherit" },
  );
  children.push(child);
  child.on("error", () => void stop(1));
  child.on("exit", () => {
    if (!stopping) void stop(1);
  });
}
process.on("SIGTERM", () => void stop(0));
process.on("SIGINT", () => void stop(0));

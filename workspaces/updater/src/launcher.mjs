#!/usr/bin/env node
import { spawn } from "node:child_process";
import { join } from "node:path";
import { json, fail } from "./files.mjs";

const [file, side] = process.argv.slice(2);
if (!["server", "client", "admin"].includes(side)) fail("invalid_application");
const config = await json(file);
const child = spawn(
  process.execPath,
  [side === "server" ? "dist/main.js" : "start.mjs"],
  {
    cwd: join(config.root, "workspaces", side),
    env: {
      ...process.env,
      NODE_PATH: join(config.root, "node_modules"),
      UNICORE_CODE_ROOT: config.root,
      UNICORE_DATA_ROOT: config.data,
      UNICORE_UPDATE_HOLD_FILE: config.holdFile,
    },
    stdio: "inherit",
  },
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("error", () => process.exit(1));
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { atomic, json, exists } from "./files.mjs";
import { processScope } from "./process-groups.mjs";

const [registry, specification] = process.argv.slice(2);
const spec = await json(specification);
const identity = (await readFile(`/proc/${process.pid}/stat`, "utf8")).split(") ")[1].split(" ")[19];
await atomic(registry, { pid: process.pid, identity, scope: await processScope() });
if (!(await exists(specification))) process.exit(1);
const child = spawn(spec.file, spec.args, { cwd: spec.cwd, env: spec.env, stdio: "inherit" });
child.on("error", () => process.exit(1));
child.on("exit", (code) => process.exit(code ?? 1));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));

import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { atomic, fail } from "./files.mjs";

export async function dockerEnvironment(source, destination) {
  const values = parseEnv(await readFile(source, "utf8"));
  const lines = [];
  const inherited = {};
  for (const [key, value] of Object.entries(values)) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) || value.includes("\0"))
      fail("invalid_environment");
    if (/[\r\n]/.test(value)) inherited[key] = value;
    else lines.push(`${key}=${value}`);
  }
  await atomic(destination, lines.join("\n") + "\n");
  return {
    args: ["--env-file", destination, ...Object.keys(inherited).flatMap(key => ["--env", key])],
    env: { ...process.env, ...inherited },
  };
}

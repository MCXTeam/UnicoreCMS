import { spawn } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { hash, fail } from "./files.mjs";

export async function command(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      windowsHide: true,
      ...options,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const chunks = [];
    let bytes = 0;
    let errors = "";
    const timer = setTimeout(
      () => child.kill("SIGKILL"),
      options.timeout || 1800000,
    );
    child.stdout.on("data", (data) => {
      bytes += data.length;
      if (bytes > (options.maxOutput || 8 * 1024 * 1024)) child.kill("SIGKILL");
      else chunks.push(data);
    });
    child.stderr.on("data", (data) => {
      errors = (errors + data.toString()).slice(-32000);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (signal || bytes > (options.maxOutput || 8 * 1024 * 1024))
        reject(
          Object.assign(new Error("Command interrupted"), {
            code: "command_interrupted",
          }),
        );
      else resolve({ code, output: Buffer.concat(chunks), errors });
    });
  });
}
const equal = (a, b) => (a === null || b === null ? a === b : a.equals(b));
export async function mergeFile(base, local, target, temp) {
  if (equal(local, base)) return { data: target, kind: "official" };
  if (equal(target, base) || equal(local, target))
    return { data: local, kind: "local" };
  if (
    [base, local, target].some(
      (v) => v === null || v.includes(0) || v.length > 1024 * 1024,
    )
  )
    return { data: local, kind: "conflict" };
  const dir = await mkdtemp(join(temp, "merge-"));
  try {
    await Promise.all(
      [
        ["local", local],
        ["base", base],
        ["target", target],
      ].map(([n, data]) => writeFile(join(dir, n), data)),
    );
    const result = await command("git", [
      "merge-file",
      "-p",
      "--diff3",
      "-L",
      "local",
      "-L",
      "base",
      "-L",
      "target",
      join(dir, "local"),
      join(dir, "base"),
      join(dir, "target"),
    ]);
    if (result.code > 127 || result.code === null) fail("merge_failed");
    return {
      data: result.output,
      kind: result.code === 0 ? "merged" : "conflict",
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
export function compatibility(components) {
  const provides = {};
  const errors = [];
  for (const [name, part] of Object.entries(components)) {
    for (const [contract, version] of Object.entries(part.provides)) {
      if (provides[contract] && provides[contract] !== version)
        errors.push(`${name}: ${contract}`);
      provides[contract] = version;
    }
  }
  for (const [name, part] of Object.entries(components))
    for (const [contract, versions] of Object.entries(part.requires))
      if (!versions.includes(provides[contract]))
        errors.push(`${name}: ${contract}`);
  if (new Set(Object.values(components).map((c) => c.dependencySet)).size !== 1)
    errors.push("dependency_set");
  return errors;
}

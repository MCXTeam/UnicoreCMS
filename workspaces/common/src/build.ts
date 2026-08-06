import { spawnSync } from "child_process";
import { readFileSync } from "fs";

import {
  BUILD_HEAP_MIN_MB,
  BUILD_HEAP_SHARE,
  BUILD_KILL_SIGNALS,
  CGROUP_LIMIT_FILES,
  CGROUP_LIMIT_MAX,
} from "./constants";

export function heapOptions(): string[] {
  for (const file of CGROUP_LIMIT_FILES) {
    let limit: number;

    try {
      limit = Number(readFileSync(file, "utf8").trim());
    } catch {
      continue;
    }

    if (!Number.isFinite(limit) || limit <= 0 || limit > CGROUP_LIMIT_MAX) continue;

    const megabytes = Math.floor((limit / 1024 / 1024) * BUILD_HEAP_SHARE);

    if (megabytes >= BUILD_HEAP_MIN_MB) return [`--max-old-space-size=${megabytes}`];
  }

  return [];
}

export function runNode(args: string[], cwd?: string): void {
  const result = spawnSync(process.execPath, [...heapOptions(), ...args], { stdio: "inherit", cwd });

  if (result.error) throw result.error;

  if (result.signal && BUILD_KILL_SIGNALS.includes(result.signal)) {
    process.stderr.write(
      `\nBuild step killed by ${result.signal}: not enough memory. Raise the container memory limit or build with OBFUSCATE=0.\n`,
    );

    process.exit(1);
  }

  if (result.status !== 0) process.exit(result.status === null ? 1 : result.status);
}

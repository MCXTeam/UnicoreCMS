import { spawn } from "child_process";
import { cpus, totalmem } from "os";
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import { dirname, resolve } from "path";

import {
  BUILD_CPU_SHARE,
  BUILD_HEAP_MIN_MB,
  BUILD_HEAP_SHARE,
  BUILD_KILL_SIGNALS,
  BUILD_PARALLELISM_MAX,
  BUILD_PARALLELISM_MIN,
  BUILD_LOG_FILE_NAME,
  BUILD_LOG_MAX_BYTES,
  CGROUP_LIMIT_FILES,
  CGROUP_LIMIT_MAX,
  LOG_DIR_MODE,
  LOG_DIR_NAME,
  LOG_FILE_MODE,
} from "./constants";
import { envFilePath } from "./ports";

function memoryLimit(): number | null {
  for (const file of CGROUP_LIMIT_FILES) {
    let limit: number;

    try {
      limit = Number(readFileSync(file, "utf8").trim());
    } catch {
      continue;
    }

    if (!Number.isFinite(limit) || limit <= 0 || limit > CGROUP_LIMIT_MAX)
      continue;

    return limit;
  }

  const total = totalmem();

  return Number.isFinite(total) && total > 0 ? total : null;
}

export function heapOptions(): string[] {
  const limit = memoryLimit();

  if (!limit) return [];

  const megabytes = Math.floor((limit / 1024 / 1024) * BUILD_HEAP_SHARE);

  return megabytes >= BUILD_HEAP_MIN_MB
    ? [`--max-old-space-size=${megabytes}`]
    : [];
}

export function buildParallelism(): number {
  const available = cpus()?.length || BUILD_PARALLELISM_MIN;

  return Math.min(
    BUILD_PARALLELISM_MAX,
    Math.max(BUILD_PARALLELISM_MIN, Math.floor(available * BUILD_CPU_SHARE)),
  );
}

export function buildLogPath(): string {
  const directory = resolve(dirname(envFilePath), LOG_DIR_NAME);

  mkdirSync(directory, { recursive: true, mode: LOG_DIR_MODE });

  const path = resolve(directory, BUILD_LOG_FILE_NAME);

  try {
    if (statSync(path).size > BUILD_LOG_MAX_BYTES)
      writeFileSync(path, "", { mode: LOG_FILE_MODE });
  } catch {}

  return path;
}

export function runNode(args: string[], cwd?: string): Promise<void> {
  const logPath = buildLogPath();
  const write = (chunk: string | Uint8Array) => {
    try {
      appendFileSync(logPath, chunk, { mode: LOG_FILE_MODE });
    } catch {}
  };

  write(`\n=== ${new Date().toISOString()} ${args.join(" ")} ===\n`);

  return new Promise((done, fail) => {
    const child = spawn(process.execPath, [...heapOptions(), ...args], {
      cwd,
      stdio: ["inherit", "pipe", "pipe"],
    });

    child.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
      write(chunk);
    });

    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
      write(chunk);
    });

    child.on("error", fail);

    child.on("close", (status, signal) => {
      if (signal && BUILD_KILL_SIGNALS.includes(signal)) {
        const message = `\nBuild step killed by ${signal}: not enough memory. Raise the container memory limit or build with OBFUSCATE=0.\nFull log: ${logPath}\n`;

        process.stderr.write(message);
        write(message);
        process.exit(1);
      }

      if (status !== 0) {
        const message = `\nBuild step failed with exit code ${status}.\nFull log: ${logPath}\n`;

        process.stderr.write(message);
        write(message);
        process.exit(status === null ? 1 : status);
      }

      done();
    });
  });
}

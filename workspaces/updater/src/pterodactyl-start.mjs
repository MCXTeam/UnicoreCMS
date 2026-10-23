import { cp, mkdir, readdir, readFile, rm, statfs } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { ensureInstallation } from "./bootstrap.mjs";
import { exists, managed, atomic, json, fail } from "./files.mjs";
import { checked } from "./deployment.mjs";

export async function preparePterodactyl(data) {
  data = resolve(data);
  const base = join(data, ".unicore-updater");
  const directory = join(base, "state");
  const file = join(directory, "config.json");
  if (await exists(file)) return { config: await json(file), file, directory };
  const source = await exists(join(data, "site/package.json")) ? join(data, "site") : data;
  const root = source === data ? join(base, "initial") : source;
  const staging = join(base, "initial-staging");
  if (source === data && !(await exists(join(root, "package.json")))) {
    const space = await statfs(data);
    const bytes = Number((await checked("du", ["-sb", "--exclude=.unicore-updater", "--exclude=storage", "--exclude=logs", source])).split(/\s/)[0]);
    if (space.bavail * space.bsize < bytes * 1.2 + 512 * 1024 ** 2) fail("insufficient_disk");
    await rm(staging, { recursive: true, force: true });
    await mkdir(staging, { recursive: true, mode: 0o700 });
    for (const entry of await readdir(source, { withFileTypes: true })) {
      if (!managed(entry.name) && entry.name !== "node_modules") continue;
      await cp(join(source, entry.name), join(staging, entry.name), { recursive: true, dereference: false,
        filter: (path) => {
          const relative = path.slice(source.length + 1).replaceAll("\\", "/");
          return !relative.split("/").some((part) => [".git", ".codex"].includes(part));
        } });
    }
    for (const side of ["server", "client", "admin"]) {
      const output = side === "server" ? "dist" : ".output";
      if (!(await exists(join(staging, "workspaces", side, output)))) fail("pterodactyl_build_required");
    }
    const { rename } = await import("node:fs/promises");
    await rename(staging, root);
  }
  const publicKey = await readFile(new URL("../../release-signing-public.pem", import.meta.url), "utf8")
    .catch(() => readFile(new URL("../../../compat/release-signing-public.pem", import.meta.url), "utf8"));
  const installed = await ensureInstallation(root, data, { directory, publicKey, executor: "native", database: { containerClient: false } });
  return { config: installed.config, file, directory };
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const data = resolve(process.argv[2] || "/home/container");
  let file, root, directory, external = "0";
  try {
    const prepared = await preparePterodactyl(data);
    directory = prepared.directory;
    root = prepared.config.root;
    file = join(directory, "runtime/src/managed.mjs");
  } catch {
    await atomic(join(data, ".unicore-updater-setup.json"), { state: "attention", error: "pterodactyl_setup_failed" }).catch(() => {});
    root = await exists(join(data, "site/package.json")) ? join(data, "site") : data;
    file = fileURLToPath(new URL("./managed.mjs", import.meta.url));
    external = "1";
  }
  const child = spawn(process.execPath, [file, root], {
    env: { ...process.env, UNICORE_UPDATER_EXTERNAL: external, UNICORE_UPDATER_PTERODACTYL: "1", ...(directory ? { UNICORE_UPDATER_DIRECTORY: directory } : {}), UNICORE_CODE_ROOT: root, UNICORE_DATA_ROOT: data }, stdio: "inherit",
  });
  for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => child.kill(signal));
  child.on("exit", (code) => process.exit(code ?? 1));
}

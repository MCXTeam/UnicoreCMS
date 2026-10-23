import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  writeFile,
  rename,
  readdir,
  lstat,
  open,
} from "node:fs/promises";
import { resolve, relative, dirname, join, isAbsolute } from "node:path";

export const hash = (data) => createHash("sha256").update(data).digest("hex");
export const digest = (value) => hash(JSON.stringify(value));
export const fail = (code, detail = code) => {
  throw Object.assign(new Error(detail), { code });
};
export const exists = async (path) =>
  lstat(path).then(
    () => true,
    (error) => (error.code === "ENOENT" ? false : Promise.reject(error)),
  );
export const json = async (path) => JSON.parse(await readFile(path, "utf8"));
export const optionalJson = async (path, fallback) =>
  (await exists(path)) ? json(path) : fallback;
export const managed = (name) =>
  ![
    "storage",
    "logs",
    "modules",
    "themes",
    ".codex",
    ".playwright-mcp",
    ".ssh",
  ].includes(name.split("/")[0]) &&
  !name
    .split("/")
    .some(
      (p) =>
        [
          ".git",
          ".svn",
          "node_modules",
          ".nuxt",
          ".output",
          "dist",
          "initial-admin.txt",
          ".npmrc",
        ].includes(p) ||
        (p.startsWith(".env") && p !== ".env.example") ||
        p.endsWith(".log"),
    ) &&
  !name.startsWith("docker/mysql-data");
export function safeName(name) {
  if (
    typeof name !== "string" ||
    !name ||
    name.length > 250 ||
    /[\\\x00-\x1f:]/.test(name) ||
    isAbsolute(name) ||
    name.split("/").some((p) => !p || p === ".." || p === ".")
  )
    fail("unsafe_path");
  return name;
}
export function inside(root, path) {
  const result = resolve(root, path);
  const rel = relative(resolve(root), result);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) fail("unsafe_path");
  return result;
}
export async function noLinks(root, name) {
  const target = inside(root, safeName(name));
  let part = resolve(root);
  if ((await lstat(part)).isSymbolicLink()) fail("symlink");
  for (const segment of name.split("/")) {
    part = join(part, segment);
    if ((await exists(part)) && (await lstat(part)).isSymbolicLink())
      fail("symlink");
  }
  return target;
}
export async function atomic(path, value) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temp = `${path}.${randomUUID()}.tmp`;
  const handle = await open(temp, "wx", 0o600);
  try {
    await handle.writeFile(
      typeof value === "string" || Buffer.isBuffer(value)
        ? value
        : JSON.stringify(value, null, 2),
    );
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temp, path);
  if (process.platform !== "win32") {
    const dir = await open(dirname(path), "r");
    try {
      await dir.sync();
    } finally {
      await dir.close();
    }
  }
}
export async function scan(root, accept = managed, prefix = "") {
  const files = {};
  for (const entry of (
    await readdir(join(root, prefix), { withFileTypes: true })
  ).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (!accept(name)) continue;
    if (entry.isSymbolicLink()) fail("symlink", name);
    if (entry.isDirectory())
      Object.assign(files, await scan(root, accept, name));
    else if (entry.isFile())
      files[name] = hash(await readFile(inside(root, name)));
    else fail("special_file", name);
  }
  return Object.fromEntries(
    Object.entries(files).sort(([a], [b]) => a.localeCompare(b)),
  );
}

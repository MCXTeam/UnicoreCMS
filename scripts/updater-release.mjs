import { readFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";
import { publishBundle, parts } from "../workspaces/updater/src/releases.mjs";
import { hash } from "../workspaces/updater/src/files.mjs";

const root = resolve(process.argv[2] || ".");
const output = resolve(process.argv[3] || "../unicore-release");
const pkg = JSON.parse(await readFile(join(root, "package.json")));
const policy = JSON.parse(await readFile(join(root, "compat/updater.json")));
const lock = hash(await readFile(join(root, "pnpm-lock.yaml")));
const components = {};
for (const name of parts) {
  const version =
    name === "root"
      ? pkg.version
      : JSON.parse(
          await readFile(join(root, "workspaces", name, "package.json")),
        ).version;
  components[name] = {
    version,
    dependencySet: lock,
    provides: policy.components[name]?.provides || {},
    requires: policy.components[name]?.requires || {},
  };
}
const metadata = {
  version: pkg.version,
  commit: execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim(),
  components,
  database: policy.database,
};
await publishBundle(
  root,
  output,
  metadata,
  await readFile(process.env.UNICORE_RELEASE_SIGNING_KEY_FILE),
);

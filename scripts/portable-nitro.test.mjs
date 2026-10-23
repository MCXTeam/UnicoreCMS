import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { portableImports, portableNitro } from "./portable-nitro.mjs";

test("Nitro imports survive moving the whole installation, including nested chunks and package export restrictions", async (t) => {
  const base = await mkdtemp(join(process.env.TEST_TMPDIR || tmpdir(), "portable-nitro-"));
  t.after(() => rm(base, { recursive: true, force: true }));
  const root = join(base, "original");
  const output = join(root, "workspaces/client/.output/server");
  await mkdir(join(output, "chunks"), { recursive: true });
  const dependency = join(root, "node_modules/fixture/internal.mjs");
  await mkdir(join(root, "node_modules/fixture"), { recursive: true });
  await writeFile(join(root, "node_modules/fixture/package.json"), '{"exports":{}}');
  await writeFile(dependency, 'export const value = "moved"');
  await writeFile(join(output, "index.mjs"), 'import { value } from "./chunks/module.mjs"; process.stdout.write(value)');
  await writeFile(join(output, "chunks/module.mjs"), `export { value } from ${JSON.stringify(pathToFileURL(dependency).href)};`);
  await portableNitro(output, root);
  const target = join(base, "moved");
  await cp(root, target, { recursive: true });
  await rm(root, { recursive: true, force: true });
  const result = spawnSync(process.execPath, [join(target, "workspaces/client/.output/server/index.mjs")], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "moved");
});
test("portable import rewriting changes only module specifiers and rejects dependencies outside the installation", () => {
  const root = join(tmpdir(), "site"), file = join(root, ".output/server/chunk.mjs"), dependency = join(root, "node_modules/fixture.mjs");
  const output = portableImports(`import(${JSON.stringify(pathToFileURL(dependency).href)}); const userText=${JSON.stringify(pathToFileURL(dependency).href)}; import 'node:fs';`, file, root);
  assert(output.includes('import("../../node_modules/fixture.mjs")'));
  assert(output.includes(`const userText=${JSON.stringify(pathToFileURL(dependency).href)}`));
  assert.throws(() => portableImports(`import ${JSON.stringify(pathToFileURL(join(tmpdir(), "outside.mjs")).href)}`, file, root), /outside the installation/);
});

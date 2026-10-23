import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dockerEnvironment } from "../src/environment.mjs";

test("Docker environment preserves dotenv values without quoting numbers or exposing multiline values in arguments", async () => {
  const folder = await mkdtemp(join(tmpdir(), "unicore-environment-"));
  try {
    const source = join(folder, ".env");
    const target = join(folder, "docker.env");
    await writeFile(source, 'REAL_DECIMALS="2"\nEMPTY=""\nQUOTED=\'a"b#c\\d\'\nMULTILINE="first\nsecond"\n');
    const result = await dockerEnvironment(source, target);
    assert.deepEqual((await readFile(target, "utf8")).trimEnd().split("\n").sort(), ['REAL_DECIMALS=2', 'EMPTY=', 'QUOTED=a"b#c\\d'].sort());
    assert.deepEqual(result.args, ["--env-file", target, "--env", "MULTILINE"]);
    assert.equal(result.env.MULTILINE, "first\nsecond");
    assert.equal(JSON.stringify(result.args).includes("second"), false);
  } finally { await rm(folder, { recursive: true, force: true }); }
});

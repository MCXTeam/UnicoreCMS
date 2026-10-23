import assert from "node:assert/strict";
import { test } from "node:test";
import { LocalExecutor } from "../src/executor.mjs";

test("recovery must confirm processes stopped before restoring the database", async () => {
  const executor = new LocalExecutor({ directory: "/fixture/state", data: "/fixture/data", database: {}, deployment: { type: "docker", container: "fixture" } });
  let restored = false;
  executor.interrupt = async () => {};
  executor.deployment = { stop: async () => { throw Object.assign(new Error("stop failed"), { code: "stop_failed" }); } };
  executor.database = { restore: async () => { restored = true; } };
  await assert.rejects(executor.recover({ id: "a".repeat(36) }, { restoreDatabase: true }), { code: "stop_failed" });
  assert.equal(restored, false);
});

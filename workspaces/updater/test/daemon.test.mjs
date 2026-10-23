import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { serve } from "../src/daemon.mjs";
import { atomic } from "../src/files.mjs";

test("restart interrupts temporary tasks before resuming recovery or permitting a new verification", async () => {
  const directory = await mkdtemp(join(tmpdir(), "unicore-interrupt-"));
  const operations = ["verifying", "migrating"].map(state => ({ id: randomUUID(), state }));
  const events = [];
  const coordinator = {
    directory,
    init: async () => {}, unlockAfterRestart: async () => {}, installation: async () => null,
    status: async () => operations,
    interrupt: async op => { events.push("interrupt:" + op.state); },
    save: async (op, state) => { events.push("save:" + state); op.state = state; },
    recover: async id => { events.push("recover"); operations.find(op => op.id === id).state = "rolled_back"; },
  };
  let server;
  try {
    server = await serve(coordinator, { token: "a".repeat(64), port: 0 });
    assert.deepEqual(events, ["interrupt:verifying", "interrupt:migrating", "save:verification_failed", "recover"]);
    assert.deepEqual(operations.map(op => op.state), ["verification_failed", "rolled_back"]);
  } finally {
    if (server) await new Promise(r => server.close(r));
    await rm(directory, { recursive: true, force: true });
  }
});

test("restart while opening requires manual review without restoring the database", async () => {
  const directory = await mkdtemp(join(tmpdir(), "unicore-opening-"));
  const operation = { id: randomUUID(), state: "opening" };
  let recoveries = 0;
  const coordinator = {
    directory,
    init: async () => {},
    unlockAfterRestart: async () => {},
    installation: async () => null,
    status: async () => [operation],
    save: async (op, state) => { op.state = state; },
    recover: async () => { recoveries++; },
  };
  let server;
  try {
    server = await serve(coordinator, { token: "a".repeat(64), port: 0 });
    assert.equal(operation.state, "recovery_required");
    assert.equal(operation.failure, "runner_restarted");
    assert.equal(recoveries, 0);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/status`, { headers: { Authorization: "Bearer " + "a".repeat(64) } });
    const status = await response.json();
    assert.equal(status.operations[0].recoverable, false);
  } finally {
    if (server) await new Promise(r => server.close(r));
    await rm(directory, { recursive: true, force: true });
  }
});

test("runner authenticates requests, persists jobs and keeps private operation data out of status", async () => {
  const directory = await mkdtemp(join(tmpdir(), "unicore-daemon-"));
  const token = "a".repeat(64);
  const operation = { id: randomUUID(), state: "planned", previous: { env: "PRIVATE_SECRET" }, input: "PRIVATE_SECRET", manifest: { version: "1.3.1", commit: "a".repeat(40), secret: "PRIVATE_SECRET" } };
  const coordinator = { directory, init: async () => {}, unlockAfterRestart: async () => {}, installation: async () => null, status: async () => [operation], source: { list: async () => [] }, resolve: async () => operation };
  let server;
  try {
    await mkdir(join(directory, "jobs"));
    const interrupted = randomUUID();
    await atomic(join(directory, "jobs", `${interrupted}.json`), { id: interrupted, action: "verify", createdAt: new Date(0).toISOString(), state: "running", input: { text: "PRIVATE_SECRET" } });
    server = await serve(coordinator, { token, port: 0 });
    const url = `http://127.0.0.1:${server.address().port}`;
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    assert.equal((await fetch(url + "/status")).status, 401);
    assert.equal((await fetch(url + "/jobs", { method: "POST", headers, body: JSON.stringify({ action: "shell", actor: "test", input: {} }) })).status, 400);
    const response = await fetch(url + "/jobs", { method: "POST", headers, body: JSON.stringify({ action: "resolve", actor: "test", input: { id: operation.id, text: "PRIVATE_SECRET" } }) });
    assert.equal(response.status, 202);
    const queued = await response.json();
    let status;
    for (let i = 0; i < 30; i++) {
      status = await fetch(url + "/status", { headers }).then(r => r.json());
      if (status.jobs.find(j => j.id === queued.id)?.state === "completed") break;
      await new Promise(r => setTimeout(r, 50));
    }
    assert.equal(status.jobs.find(j => j.id === queued.id).state, "completed");
    assert.equal(status.jobs.find(j => j.id === interrupted).state, "interrupted");
    assert.equal(JSON.stringify(status).includes("PRIVATE_SECRET"), false);
    assert.equal(status.operations[0].recoverable, false);
  } finally {
    if (server) await new Promise(r => server.close(r));
    await rm(directory, { recursive: true, force: true });
  }
});

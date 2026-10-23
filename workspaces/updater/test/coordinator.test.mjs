import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, readFile, cp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { UpdateCoordinator } from "../src/coordinator.mjs";
import { atomic, scan, digest, fail } from "../src/files.mjs";
import { metadata } from "./helpers.mjs";

async function fixture(task) {
  const folder = await mkdtemp(join(tmpdir(), "unicore-coordinator-"));
  try {
    const root = join(folder, "site");
    const directory = join(folder, "state");
    await mkdir(join(root, "workspaces/client"), { recursive: true });
    await writeFile(
      join(root, "workspaces/client/footer.txt"),
      "a\nb\nc\nd\ne\nf\n",
    );
    await writeFile(join(root, "package.json"), '{"version":"1.3.0"}');
    await writeFile(join(root, ".env"), "private");
    const events = [];
    let stage = "";
    let input = "same";
    const executor = {
      fingerprint: async () => input,
      candidateFingerprint: async (op) =>
        digest(await scan(join(directory, "operations", op.id, "candidate"))),
      extensions: async () => [],
      preflight: async () => {},
      verify: async () => {
        events.push("verify");
      },
      quiesce: async () => {
        events.push("stop");
      },
      backup: async () => {
        events.push("backup");
        return { verified: stage !== "backup" };
      },
      migrate: async () => {
        events.push("migrate");
        if (stage === "migrate") fail("migration_failed");
      },
      activate: async () => {
        events.push("activate");
      },
      check: async () => {
        events.push("check");
        if (stage === "check") fail("health_failed");
      },
      open: async () => {
        events.push("open");
        if (stage === "open") fail("open_failed");
      },
      recover: async (_op, options) => {
        events.push(options.restoreDatabase ? "restore" : "resume");
      },
    };
    const snapshots = {};
    for (const version of ["1.3.0", "1.4.0"]) {
      const path = join(folder, version);
      await cp(root, path, { recursive: true });
      if (version === "1.4.0")
        await writeFile(
          join(path, "workspaces/client/footer.txt"),
          "a\nb\nc\nd\ne\nnew\n",
        );
      snapshots[version] = {
        ...metadata(version),
        format: 1,
        files: await scan(path),
      };
    }
    const source = {
      get: async (id, target) => {
        await cp(join(folder, id), target, {
          recursive: true,
          filter: (p) => !p.endsWith(".env"),
        });
        return structuredClone(snapshots[id]);
      },
    };
    const core = new UpdateCoordinator({ directory, root, source, executor });
    await core.init();
    const preview = await core.adoption("1.3.0");
    await core.adoption("1.3.0", preview.fingerprint);
    await task({
      core,
      root,
      directory,
      events,
      executor,
      setStage: (value) => {
        stage = value;
      },
      changeInput: () => {
        input = "changed";
      },
    });
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}
test("restart reclaims a lease belonging to the previous container namespace", { skip: process.platform !== "linux" }, () =>
  fixture(async ({ core }) => {
    await atomic(core.path("lock"), { pid: process.pid, identity: "old", scope: "previous-namespace" });
    await core.unlockAfterRestart();
    await assert.rejects(readFile(core.path("lock")), { code: "ENOENT" });
  }),
);
test("complete update preserves customization and protected data; repeat apply is idempotent", () =>
  fixture(async ({ core, root, directory, events }) => {
    await writeFile(
      join(root, "workspaces/client/footer.txt"),
      "custom\nb\nc\nd\ne\nf\n",
    );
    const plan = await core.plan("1.4.0", ["client"], "test");
    assert.equal(plan.changes[0].kind, "merged");
    const ready = await core.verify(plan.id);
    assert.equal(ready.state, "ready");
    const result = await core.apply(plan.id, ready.planHash);
    assert.equal(result.state, "completed");
    assert.equal(
      await readFile(
        join((await core.installation()).root, "workspaces/client/footer.txt"),
        "utf8",
      ),
      "custom\nb\nc\nd\ne\nnew\n",
    );
    assert.equal(await readFile(join(root, ".env"), "utf8"), "private");
    assert.deepEqual(events, [
      "verify",
      "stop",
      "backup",
      "migrate",
      "activate",
      "check",
      "open",
    ]);
    await core.apply(plan.id, ready.planHash);
    assert.equal(events.filter((e) => e === "migrate").length, 1);
  }));
test("changed code or environment invalidates preview and verification", () =>
  fixture(async ({ core, root, changeInput }) => {
    const plan = await core.plan("1.4.0", ["client"], "test");
    const ready = await core.verify(plan.id);
    changeInput();
    await assert.rejects(core.apply(plan.id, ready.planHash), {
      code: "stale_plan",
    });
  }));
for (const stage of ["backup", "migrate", "check", "open"])
  test(`failure at ${stage} follows safe recovery policy`, () =>
    fixture(async ({ core, setStage, events }) => {
      const plan = await core.plan("1.4.0", ["client"], "test");
      const ready = await core.verify(plan.id);
      setStage(stage);
      await assert.rejects(core.apply(plan.id, ready.planHash));
      const [result] = await core.status(plan.id);
      assert.equal(
        result.state,
        stage === "open" ? "recovery_required" : "rolled_back",
      );
      if (stage === "backup") assert.ok(!events.includes("migrate"));
      if (stage === "open") assert.ok(!events.includes("restore"));
      else
        assert.ok(events.includes(stage === "backup" ? "resume" : "restore"));
    }));
test("candidate changes after successful verification block installation", () =>
  fixture(async ({ core, directory }) => {
    const plan = await core.plan("1.4.0", ["client"], "test");
    const ready = await core.verify(plan.id);
    await writeFile(
      join(directory, "operations", plan.id, "candidate/package.json"),
      "{}",
    );
    await assert.rejects(core.apply(plan.id, ready.planHash), {
      code: "stale_plan",
    });
  }));
test("an outstanding operation prevents a second plan", () =>
  fixture(async ({ core }) => {
    const plan = await core.plan("1.4.0", ["client"], "test");
    await assert.rejects(core.plan("1.4.0", ["server"], "test"), {
      code: "operation_pending",
    });
    await core.cancel(plan.id);
    assert.equal((await core.status(plan.id))[0].state, "cancelled");
  }));
test("overlapping custom edit blocks verification until explicit resolution", () =>
  fixture(async ({ core, root }) => {
    await writeFile(
      join(root, "workspaces/client/footer.txt"),
      "a\nb\nc\nd\ne\ncustom\n",
    );
    const plan = await core.plan("1.4.0", ["client"], "test");
    assert.equal(plan.state, "needs_resolution");
    await assert.rejects(core.verify(plan.id), { code: "plan_blocked" });
    const diff = await core.diff(plan.id, "workspaces/client/footer.txt");
    assert.equal(diff.local, "a\nb\nc\nd\ne\ncustom\n");
    await assert.rejects(
      core.resolve(
        plan.id,
        "workspaces/client/footer.txt",
        "manual",
        "<<<<<<< local\na",
      ),
      { code: "invalid_resolution" },
    );
    await core.resolve(
      plan.id,
      "workspaces/client/footer.txt",
      "manual",
      "a\nb\nc\nd\ne\ncustom and new\n",
    );
    assert.equal((await core.verify(plan.id)).state, "ready");
  }));
test("two executors cannot change the installation concurrently", () =>
  fixture(async ({ core }) => {
    let release;
    const running = core.exclusive(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    while (!release) await new Promise((resolve) => setTimeout(resolve, 1));
    await assert.rejects(
      core.exclusive(async () => {}),
      { code: "update_locked" },
    );
    await assert.rejects(core.unlockAfterRestart(), { code: "update_locked" });
    release();
    await running;
  }));
test("a directory left before the first operation checkpoint does not prevent startup", () =>
  fixture(async ({ core, directory }) => {
    await mkdir(join(directory, "operations/11111111-1111-1111-1111-111111111111"));
    assert.deepEqual(await core.status(), []);
  }));
test("recovery is durable and never restores a database after opening", () =>
  fixture(async ({ core, events, directory, root, executor }) => {
    const plan = await core.plan("1.4.0", ["client"], "test");
    plan.backup = { verified: true };
    await core.save(plan, "migrating");
    const restarted = new UpdateCoordinator({
      directory,
      root,
      source: core.source,
      executor,
    });
    assert.equal((await restarted.recover(plan.id)).state, "rolled_back");
    assert.ok(events.includes("restore"));
    await core.save(plan, "opening");
    const count = events.filter((e) => e === "restore").length;
    await assert.rejects(restarted.recover(plan.id), {
      code: "manual_recovery_required",
    });
    assert.equal(events.filter((e) => e === "restore").length, count);
  }));
test("compiled customization requires an explicit rebuild decision", () =>
  fixture(async ({ core, executor }) => {
    executor.artifacts = async () => [{ part: "client", accepted: false }];
    const plan = await core.plan("1.4.0", ["client"], "test");
    await assert.rejects(core.verify(plan.id), { code: "plan_blocked" });
    await core.acceptArtifacts(plan.id, ["client"]);
    assert.equal((await core.verify(plan.id)).state, "ready");
  }));

test("failed pre-opening recovery can be retried without permitting post-opening restore", () =>
  fixture(async ({ core, executor }) => {
    const plan = await core.plan("1.4.0", ["client"], "test");
    plan.backup = { verified: true };
    await core.save(plan, "migrating");
    const original = executor.recover;
    executor.recover = async () => {
      throw Object.assign(new Error(), { code: "database_offline" });
    };
    assert.equal((await core.recover(plan.id)).state, "recovery_required");
    executor.recover = original;
    assert.equal((await core.recover(plan.id)).state, "rolled_back");
    plan.recoveryPhase = undefined;
    await core.save(plan, "recovery_required");
    await assert.rejects(core.recover(plan.id), {
      code: "manual_recovery_required",
    });
  }));

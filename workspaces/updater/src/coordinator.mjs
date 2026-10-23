import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  writeFile,
  rm,
  readdir,
  open,
  unlink,
  statfs,
} from "node:fs/promises";
import { join, dirname, resolve, relative, isAbsolute } from "node:path";
import {
  atomic,
  json,
  optionalJson,
  scan,
  hash,
  digest,
  exists,
  inside,
  noLinks,
  fail,
} from "./files.mjs";
import { component, parts } from "./releases.mjs";
import { compatibility, mergeFile } from "./merge.mjs";

const finalStates = ["completed", "rolled_back", "cancelled", "failed"];
const recoveryStates = [
  "quiescing",
  "backing_up",
  "migrating",
  "activating",
  "checking",
  "recovering",
];
export const canRecover = (op) =>
  recoveryStates.includes(op?.state) ||
  (op?.state === "recovery_required" &&
    recoveryStates.includes(op.recoveryPhase));
const read = async (root, name) =>
  (await exists(join(root, name))) ? readFile(await noLinks(root, name)) : null;
const processStart = (raw) =>
  raw.slice(raw.lastIndexOf(")") + 2).split(" ")[19];
export class UpdateCoordinator {
  constructor({
    directory,
    root,
    source,
    executor,
    installationId = randomUUID(),
  }) {
    this.directory = resolve(directory);
    this.root = resolve(root);
    this.source = source;
    this.executor = executor;
    this.installationId = installationId;
    const rel = relative(this.root, this.directory);
    if (!rel || (!rel.startsWith("..") && !isAbsolute(rel)))
      fail("state_inside_application");
  }
  path(name) {
    return inside(this.directory, name);
  }
  async init() {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    await mkdir(this.path("operations"), { recursive: true });
  }
  async installation() {
    return optionalJson(this.path("installation.json"), null);
  }
  async currentRoot() {
    return (await this.installation())?.root || this.root;
  }
  async interrupt(op) {
    await this.executor.interrupt?.(op);
  }
  async status(id) {
    if (id && !/^[a-f0-9-]{36}$/.test(id)) fail("invalid_operation");
    const ids = id ? [id] : await readdir(this.path("operations"));
    const operations = await Promise.all(
      ids
        .filter((n) => /^[a-f0-9-]{36}$/.test(n))
        .map((n) => optionalJson(this.path(`operations/${n}/operation.json`), null)),
    );
    return operations.filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async save(op, state = op.state) {
    if (!op.events?.length || op.events[op.events.length - 1].state !== state)
      (op.events ||= []).push({ state, at: new Date().toISOString() });
    op.state = state;
    op.updatedAt = new Date().toISOString();
    await atomic(this.path(`operations/${op.id}/operation.json`), op);
    return op;
  }
  async recordFailure(op, error) {
    await atomic(this.path(`operations/${op.id}/private-error.json`), {
      at: new Date().toISOString(),
      state: op.state,
      code: error.code || "operation_failed",
      diagnostic: String(error.diagnostic || error.message || "").slice(-32000),
    }).catch(() => {});
  }
  async exclusive(run) {
    await this.init();
    let lock;
    try {
      lock = await open(this.path("lock"), "wx", 0o600);
    } catch (e) {
      if (e.code === "EEXIST") fail("update_locked");
      throw e;
    }
    const identity =
      process.platform === "linux"
        ? processStart(await readFile(`/proc/${process.pid}/stat`, "utf8"))
        : null;
    try {
      await lock.writeFile(
        JSON.stringify({ pid: process.pid, identity, startedAt: Date.now() }),
      );
      await lock.sync();
      return await run();
    } finally {
      await lock.close();
      await unlink(this.path("lock"));
    }
  }
  async unlockAfterRestart() {
    const lock = await optionalJson(this.path("lock"), null);
    if (!lock) return;
    if (process.platform === "linux" && lock.identity) {
      const identity = await readFile(`/proc/${lock.pid}/stat`, "utf8").then(
        processStart,
        (e) => (e.code === "ENOENT" ? null : Promise.reject(e)),
      );
      if (identity !== lock.identity) {
        await unlink(this.path("lock"));
        return;
      }
    }
    try {
      process.kill(lock.pid, 0);
      fail("update_locked");
    } catch (e) {
      if (e.code !== "ESRCH") throw e;
    }
    await unlink(this.path("lock"));
  }
  async adoption(releaseId, fingerprint) {
    return this.exclusive(async () => {
      if (await this.installation()) fail("already_adopted");
      const path = this.path("adoption");
      let manifest = await optionalJson(
        this.path("adoption-manifest.json"),
        null,
      );
      if (!manifest || manifest.version !== releaseId.replace(/^v/, "")) {
        await rm(path, { recursive: true, force: true });
        manifest = await this.source.get(releaseId, path);
        await atomic(this.path("adoption-manifest.json"), manifest);
      }
      const files = await scan(this.root);
      const changes = [
        ...new Set([...Object.keys(files), ...Object.keys(manifest.files)]),
      ].filter((n) => files[n] !== manifest.files[n]);
      const matching = Object.keys(manifest.files).filter(
        (n) => files[n] === manifest.files[n],
      ).length;
      if (!matching) fail("unknown_baseline");
      const expected = digest({ releaseId, files, manifest });
      if (!fingerprint)
        return {
          fingerprint: expected,
          changes,
          matching,
          total: Object.keys(manifest.files).length,
          version: manifest.version,
        };
      if (fingerprint !== expected) fail("stale_plan");
      const missingSources =
        !(await exists(join(this.root, "workspaces/server/src"))) &&
        (await exists(join(this.root, "workspaces/server/dist")))
          ? ["workspaces/server/src/"]
          : [];
      await atomic(this.path("installation.json"), {
        format: 1,
        id: this.installationId,
        root: this.root,
        components: manifest.components,
        artifacts: manifest.artifacts || {},
        files: manifest.files,
        missingSources,
        origins: Object.fromEntries(
          parts.map((p) => [
            p,
            { version: manifest.version, commit: manifest.commit, root: path },
          ]),
        ),
        manifest,
        previous: null,
      });
      return { adopted: true };
    });
  }
  async plan(releaseId, selected, actor) {
    return this.exclusive(async () => {
      const installation = await this.installation();
      if (!installation) fail("baseline_required");
      if (
        !Array.isArray(selected) ||
        !selected.length ||
        selected.some((p) => !["server", "client", "admin"].includes(p))
      )
        fail("invalid_selection");
      if ((await this.status()).some((op) => !finalStates.includes(op.state)))
        fail("operation_pending");
      const space = await statfs(this.directory);
      if (space.bavail * space.bsize < 1024 * 1024 * 1024)
        fail("insufficient_disk");
      const id = randomUUID();
      const folder = this.path(`operations/${id}`);
      await mkdir(folder, { recursive: true });
      const op = {
        id,
        createdAt: new Date().toISOString(),
        state: "preparing",
        actor,
        selected: [...new Set([...selected, "common", "api", "ui", "root"])],
        changes: [],
        errors: [],
        disabled: [],
        events: [],
      };
      await this.save(op);
      try {
        op.manifest = await this.source.get(
          releaseId,
          join(folder, "official"),
        );
        op.components = Object.fromEntries(
          parts.map((p) => [
            p,
            op.selected.includes(p)
              ? op.manifest.components[p]
              : installation.components[p],
          ]),
        );
        op.errors = compatibility(op.components);
        const current = await this.currentRoot();
        op.previous = installation;
        op.input = await this.fingerprint();
        await mkdir(join(folder, "candidate"), { recursive: true });
        const names = [
          ...new Set([
            ...Object.keys(await scan(current)),
            ...Object.keys(installation.files),
            ...Object.keys(op.manifest.files),
          ]),
        ].sort();
        for (const name of names) {
          const part = component(name);
          const base = await read(installation.origins[part].root, name);
          const found = await read(current, name);
          const local =
            found === null &&
            installation.missingSources?.some((prefix) =>
              name.startsWith(prefix),
            )
              ? base
              : found;
          const target = await read(
            op.selected.includes(part)
              ? join(folder, "official")
              : installation.origins[part].root,
            name,
          );
          const result = await mergeFile(base, local, target, folder);
          if (result.data !== null) {
            const targetFile = await noLinks(join(folder, "candidate"), name);
            await mkdir(dirname(targetFile), { recursive: true });
            await writeFile(targetFile, result.data);
          }
          if (
            (local && hash(local)) !== (target && hash(target)) ||
            result.kind === "conflict"
          )
            op.changes.push({
              path: name,
              kind: result.kind,
              resolved: result.kind !== "conflict",
              base: base && hash(base),
              local: local && hash(local),
              target: target && hash(target),
            });
        }
        op.extensions = await this.executor.extensions(op);
        op.artifacts = this.executor.artifacts
          ? await this.executor.artifacts(op, current)
          : [];
        op.planHash = await this.planHash(op);
        return this.save(
          op,
          op.changes.some((c) => !c.resolved) ? "needs_resolution" : "planned",
        );
      } catch (e) {
        await this.recordFailure(op, e);
        op.errors.push(e.code || "prepare_failed");
        await this.save(op, "failed");
        throw e;
      }
    });
  }
  async fingerprint() {
    const root = await this.currentRoot();
    return digest({
      files: await scan(root),
      runtime: await this.executor.fingerprint(root),
    });
  }
  async planHash(op) {
    return digest({
      input: op.input,
      components: op.components,
      candidate: await scan(this.path(`operations/${op.id}/candidate`)),
      disabled: op.disabled,
      artifacts: op.artifacts,
      manifest: op.manifest,
      changes: op.changes,
    });
  }
  async diff(id, name) {
    const [op] = await this.status(id);
    if (!op || !op.changes.some((c) => c.path === name)) fail("unknown_change");
    const part = component(name);
    const roots = {
      base: op.previous.origins[part].root,
      local: op.previous.root,
      target: op.selected.includes(part)
        ? this.path(`operations/${id}/official`)
        : op.previous.origins[part].root,
      result: this.path(`operations/${id}/candidate`),
    };
    const result = {};
    for (const [key, root] of Object.entries(roots)) {
      const data = await read(root, name);
      result[key] =
        data === null
          ? null
          : data.length > 1024 * 1024 || data.includes(0)
            ? { binary: true, bytes: data.length }
            : data.toString("utf8");
    }
    return result;
  }
  async resolve(id, name, choice, text) {
    return this.exclusive(async () => {
      const [op] = await this.status(id);
      if (
        ![
          "planned",
          "needs_resolution",
          "ready",
          "verification_failed",
        ].includes(op?.state)
      )
        fail("invalid_state");
      const change = op.changes.find((c) => c.path === name);
      if (!change || !["local", "target", "manual", "delete"].includes(choice))
        fail("invalid_resolution");
      const diff = await this.diff(id, name);
      const root = this.path(`operations/${id}/candidate`);
      let data;
      if (choice === "manual") {
        if (
          typeof text !== "string" ||
          Buffer.byteLength(text) > 1024 * 1024 ||
          /^(?:<<<<<<<|=======|>>>>>>>)/m.test(text)
        )
          fail("invalid_resolution");
        data = Buffer.from(text);
      } else if (choice === "delete") data = null;
      else {
        const part = component(name);
        data = await read(
          choice === "local"
            ? op.previous.root
            : op.selected.includes(part)
              ? this.path(`operations/${id}/official`)
              : op.previous.origins[part].root,
          name,
        );
      }
      const path = await noLinks(root, name);
      if (data === null) await rm(path, { force: true });
      else {
        await mkdir(dirname(path), { recursive: true });
        await atomic(path, data);
      }
      change.resolved = true;
      change.decision = choice;
      change.result = data && hash(data);
      op.planHash = await this.planHash(op);
      op.verification = null;
      return this.save(
        op,
        op.changes.some((c) => !c.resolved) ? "needs_resolution" : "planned",
      );
    });
  }
  async disable(id, extensions) {
    return this.exclusive(async () => {
      const [op] = await this.status(id);
      if (
        ![
          "planned",
          "needs_resolution",
          "ready",
          "verification_failed",
        ].includes(op?.state) ||
        !Array.isArray(extensions) ||
        extensions.some((e) => !op.extensions.some((x) => x.id === e))
      )
        fail("invalid_extensions");
      op.disabled = [...new Set(extensions)].sort();
      op.verification = null;
      op.planHash = await this.planHash(op);
      return this.save(
        op,
        op.changes.some((c) => !c.resolved) ? "needs_resolution" : "planned",
      );
    });
  }
  async acceptArtifacts(id, components) {
    return this.exclusive(async () => {
      const [op] = await this.status(id);
      if (
        !["planned", "ready", "verification_failed"].includes(op?.state) ||
        !Array.isArray(components) ||
        components.some((p) => !op.artifacts.some((a) => a.part === p))
      )
        fail("invalid_artifacts");
      for (const item of op.artifacts)
        item.accepted = components.includes(item.part);
      op.verification = null;
      op.planHash = await this.planHash(op);
      return this.save(op, "planned");
    });
  }
  async verify(id) {
    return this.exclusive(async () => {
      const [op] = await this.status(id);
      if (
        !["planned", "verification_failed", "ready"].includes(op?.state) ||
        op.errors.length ||
        op.artifacts?.some((a) => !a.accepted) ||
        op.extensions.some((e) => !op.disabled.includes(e.id))
      )
        fail("plan_blocked");
      if ((await this.fingerprint()) !== op.input) fail("stale_plan");
      op.failure = null;
      await this.save(op, "verifying");
      try {
        await this.executor.preflight(op);
        await this.executor.verify(op, this.path(`operations/${id}/candidate`));
        op.verification = {
          at: new Date().toISOString(),
          hash: await this.planHash(op),
          runtime: await this.executor.candidateFingerprint(op),
        };
        op.planHash = op.verification.hash;
        return this.save(op, "ready");
      } catch (e) {
        await this.recordFailure(op, e);
        op.failure = e.code || "verification_failed";
        await this.save(op, "verification_failed");
        throw e;
      }
    });
  }
  async apply(id, expected) {
    return this.exclusive(async () => {
      const [op] = await this.status(id);
      if (op?.state === "completed" && op.planHash === expected) return op;
      if (
        op?.state !== "ready" ||
        !op.verification ||
        op.planHash !== expected ||
        (await this.planHash(op)) !== expected ||
        (await this.fingerprint()) !== op.input ||
        (await this.executor.candidateFingerprint(op)) !==
          op.verification.runtime
      )
        fail("stale_plan");
      await this.executor.preflight(op);
      try {
        await this.save(op, "quiescing");
        await this.executor.quiesce(op);
        if ((await this.fingerprint()) !== op.input) fail("stale_plan");
        await this.save(op, "backing_up");
        op.backup = await this.executor.backup(op);
        if (!op.backup?.verified) fail("unverified_backup");
        await this.save(op, "migrating");
        await this.executor.migrate(op);
        await this.save(op, "activating");
        await this.executor.activate(op);
        await this.save(op, "checking");
        await this.executor.check(op);
        const origins = { ...op.previous.origins };
        for (const p of op.selected)
          origins[p] = {
            version: op.manifest.version,
            commit: op.manifest.commit,
            root: this.path(`operations/${id}/official`),
          };
        const files = { ...op.previous.files };
        for (const key of Object.keys(files))
          if (op.selected.includes(component(key))) delete files[key];
        for (const [key, sha] of Object.entries(op.manifest.files))
          if (op.selected.includes(component(key))) files[key] = sha;
        const installation = {
          ...op.previous,
          root: this.path(`operations/${id}/candidate`),
          missingSources: [],
          components: op.components,
          origins,
          files,
          previous: op.previous.root,
          operation: id,
          manifest: op.manifest,
          artifacts: this.executor.runtimeFiles
            ? await this.executor.runtimeFiles(
                this.path(`operations/${id}/candidate`),
              )
            : op.manifest.artifacts || {},
        };
        await atomic(this.path("installation.json"), installation);
        await this.save(op, "opening");
        await this.executor.open(op);
        return this.save(op, "completed");
      } catch (e) {
        await this.recordFailure(op, e);
        op.failure = e.code || "apply_failed";
        if (["opening", "completed"].includes(op.state)) {
          await this.save(op, "recovery_required");
          throw e;
        }
        await this.recoverOperation(op);
        throw e;
      }
    });
  }
  async recoverOperation(op) {
    const interrupted = op.recoveryPhase || op.state;
    op.recoveryPhase = interrupted;
    await this.save(op, "recovering");
    try {
      await this.executor.recover(op, {
        restoreDatabase:
          !["quiescing", "backing_up"].includes(interrupted) &&
          op.manifest.database.rollback === "restore",
        interrupted,
      });
      await atomic(this.path("installation.json"), op.previous);
      return this.save(op, "rolled_back");
    } catch (e) {
      await this.recordFailure(op, e);
      op.recoveryFailure = e.code || "recovery_failed";
      return this.save(op, "recovery_required");
    }
  }
  async recover(id) {
    return this.exclusive(async () => {
      const [op] = await this.status(id);
      if (!canRecover(op)) fail("manual_recovery_required");
      return this.recoverOperation(op);
    });
  }
  async cancel(id) {
    return this.exclusive(async () => {
      const [op] = await this.status(id);
      if (
        ![
          "planned",
          "needs_resolution",
          "ready",
          "verification_failed",
          "failed",
        ].includes(op?.state)
      )
        fail("invalid_state");
      return this.save(op, "cancelled");
    });
  }
}

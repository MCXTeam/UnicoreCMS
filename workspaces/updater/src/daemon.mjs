import { createServer } from "node:http";
import { createConnection } from "node:net";
import { timingSafeEqual, randomUUID } from "node:crypto";
import { join, resolve } from "node:path";
import {
  readdir,
  mkdir,
  readFile,
  unlink,
  chmod,
  lstat,
} from "node:fs/promises";
import { atomic, json, fail, exists } from "./files.mjs";
import { canRecover } from "./coordinator.mjs";

const actions = [
  "adopt",
  "plan",
  "resolve",
  "disable",
  "artifacts",
  "verify",
  "apply",
  "recover",
  "cancel",
];
const publicOperation = (op) => ({
  id: op.id,
  state: op.state,
  createdAt: op.createdAt,
  updatedAt: op.updatedAt,
  actor: op.actor,
  selected: op.selected,
  components: op.components,
  manifest: op.manifest && {
    version: op.manifest.version,
    commit: op.manifest.commit,
  },
  changes: op.changes,
  artifacts: op.artifacts,
  errors: op.errors,
  disabled: op.disabled,
  extensions: op.extensions,
  events: op.events,
  planHash: op.planHash,
  failure: op.failure,
  recoverable: canRecover(op),
  verification: op.verification && { at: op.verification.at },
});
export async function serve(
  coordinator,
  { token, port = 9751, host = "127.0.0.1", socketFile },
) {
  if (
    typeof token !== "string" ||
    token.length < 32 ||
    !["127.0.0.1", "::1"].includes(host)
  )
    fail("runner_configuration");
  await coordinator.init();
  await coordinator.unlockAfterRestart();
  const folder = join(coordinator.directory, "jobs");
  await mkdir(folder, { recursive: true, mode: 0o700 });
  let busy = false;
  const jobs = async () =>
    Promise.all(
      (await readdir(folder))
        .filter((n) => /^[a-f0-9-]{36}\.json$/.test(n))
        .map((n) => json(join(folder, n))),
    );
  for (const job of await jobs())
    if (job.state === "running") {
      job.state = "interrupted";
      job.error = "runner_restarted";
      await atomic(join(folder, `${job.id}.json`), job);
    }
  for (const op of await coordinator.status())
    if ([
      "verifying", "preparing", "quiescing", "backing_up", "migrating",
      "activating", "checking", "recovering", "opening",
    ].includes(op.state))
      await coordinator.interrupt?.(op);
  for (const op of await coordinator.status())
    if (["verifying", "preparing"].includes(op.state))
      await coordinator.save(op, "verification_failed");
  for (const op of await coordinator.status())
    if (op.state === "opening") {
      op.failure = "runner_restarted";
      await coordinator.save(op, "recovery_required");
    }
  for (const op of await coordinator.status())
    if (
      [
        "quiescing",
        "backing_up",
        "migrating",
        "activating",
        "checking",
        "recovering",
      ].includes(op.state)
    )
      await coordinator.recover(op.id);
  const timer = setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      const job = (await jobs())
        .filter((j) => j.state === "queued")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      if (!job) return;
      job.state = "running";
      await atomic(join(folder, `${job.id}.json`), job);
      try {
        const p = job.input;
        const result = await {
          adopt: () => coordinator.adoption(p.release, p.fingerprint),
          plan: () => coordinator.plan(p.release, p.selected, job.actor),
          resolve: () => coordinator.resolve(p.id, p.path, p.choice, p.text),
          disable: () => coordinator.disable(p.id, p.extensions),
          artifacts: () => coordinator.acceptArtifacts(p.id, p.components),
          verify: () => coordinator.verify(p.id),
          apply: () => coordinator.apply(p.id, p.hash),
          recover: () => coordinator.recover(p.id),
          cancel: () => coordinator.cancel(p.id),
        }[job.action]();
        job.result =
          job.action === "adopt"
            ? result
            : { id: result.id, state: result.state };
        job.state = "completed";
      } catch (error) {
        job.state = "failed";
        job.error = error.code || "operation_failed";
      }
      await atomic(join(folder, `${job.id}.json`), job);
    } finally {
      busy = false;
    }
  }, 250);
  timer.unref();
  const server = createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    const respond = (code, value) => {
      res.statusCode = code;
      res.end(JSON.stringify(value));
    };
    const credential = Buffer.from(
      String(req.headers.authorization || "").replace(/^Bearer /, ""),
    );
    if (
      credential.length !== Buffer.byteLength(token) ||
      !timingSafeEqual(credential, Buffer.from(token))
    )
      return respond(401, { code: "unauthorized" });
    try {
      const url = new URL(req.url, "http://localhost");
      if (req.method === "GET" && url.pathname === "/status") {
        const installation = await coordinator.installation();
        return respond(200, {
          installation: installation && {
            id: installation.id,
            components: installation.components,
            operation: installation.operation,
          },
          operations: (await coordinator.status())
            .slice(0, 20)
            .map(publicOperation),
          jobs: (await jobs())
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 40)
            .map(({ id, action, createdAt, state, result, error }) => ({
              id,
              action,
              createdAt,
              state,
              result,
              error,
            })),
          configured: true,
        });
      }
      if (req.method === "GET" && url.pathname === "/releases")
        return respond(200, await coordinator.source.list());
      if (req.method === "GET" && url.pathname === "/diff")
        return respond(
          200,
          await coordinator.diff(
            url.searchParams.get("id"),
            url.searchParams.get("path"),
          ),
        );
      if (req.method !== "POST" || url.pathname !== "/jobs")
        return respond(404, { code: "not_found" });
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 1200000) fail("request_limit");
        chunks.push(chunk);
      }
      const payload = JSON.parse(Buffer.concat(chunks).toString());
      if (
        !actions.includes(payload.action) ||
        !payload.input ||
        typeof payload.input !== "object" ||
        typeof payload.actor !== "string" ||
        payload.actor.length > 128
      )
        fail("invalid_job");
      const job = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        state: "queued",
        action: payload.action,
        input: payload.input,
        actor: payload.actor,
      };
      await atomic(join(folder, `${job.id}.json`), job);
      return respond(202, { id: job.id });
    } catch (error) {
      return respond(400, { code: error.code || "invalid_request" });
    }
  });
  server.on("close", () => clearInterval(timer));
  if (socketFile) {
    await mkdir(resolve(socketFile, ".."), { recursive: true, mode: 0o700 });
    if (await exists(socketFile)) {
      if (!(await lstat(socketFile)).isSocket()) fail("invalid_socket");
      const active = await new Promise((resolve) => {
        const connection = createConnection(socketFile);
        connection.once("connect", () => {
          connection.destroy();
          resolve(true);
        });
        connection.once("error", (error) =>
          resolve(!["ECONNREFUSED", "ENOENT"].includes(error.code)),
        );
        connection.setTimeout(1000, () => {
          connection.destroy();
          resolve(true);
        });
      });
      if (active) {
        clearInterval(timer);
        fail("runner_already_running");
      }
      await unlink(socketFile);
    }
  }
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    socketFile
      ? server.listen(socketFile, resolve)
      : server.listen(port, host, resolve);
  }).catch((error) => {
    clearInterval(timer);
    throw error;
  });
  if (socketFile) await chmod(socketFile, 0o600);
  return server;
}

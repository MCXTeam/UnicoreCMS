import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PterodactylDeployment, launcherState } from "../src/deployment.mjs";
import { json } from "../src/files.mjs";

test("Pterodactyl uses scoped HTTPS Client API power control and mapped launcher paths", async () => {
  const directory = await mkdtemp(join(tmpdir(), "unicore-panel-"));
  const original = globalThis.fetch;
  const requests = [];
  let state = "running";
  globalThis.fetch = async (url, options) => {
    const path = new URL(url).pathname;
    assert.equal(new URL(url).origin, "https://panel.example.org");
    assert.equal(options.headers.Authorization, "Bearer local-fixture");
    assert.equal(options.redirect, "error");
    assert.ok(
      path === "/api/client/servers/abcd" ||
        path.startsWith("/api/client/servers/abcd/"),
    );
    if (path === "/api/client/servers/abcd")
      return Response.json({
        attributes: {
          invocation:
            "node /home/container/unicore/runtime/src/start-all.mjs /home/container/unicore/launcher.json",
        },
      });
    if (options.body) {
      const signal = JSON.parse(options.body).signal;
      requests.push(signal);
      state = signal === "stop" ? "offline" : "running";
      return new Response(null, { status: 204 });
    }
    return Response.json({ attributes: { current_state: state } });
  };
  try {
    const launcher = join(directory, "launcher.json");
    const adapter = new PterodactylDeployment({
      url: "https://panel.example.org",
      token: "local-fixture",
      server: "abcd",
      sameHost: true,
      launcher,
      pathMap: { host: directory, container: "/home/container/unicore" },
    });
    await adapter.preflight();
    await adapter.stop();
    await adapter.activate(join(directory, "candidate"), {
      data: join(directory, "shared"),
      holdFile: join(directory, "ipc/hold"),
      hold: true,
    });
    assert.equal(
      (await json(launcher)).root,
      "/home/container/unicore/candidate",
    );
    await adapter.open(join(directory, "previous"), {
      data: join(directory, "shared"),
      holdFile: join(directory, "ipc/hold"),
    });
    assert.equal((await json(launcher)).hold, false);
    assert.deepEqual(requests, ["stop", "start", "stop", "start"]);
  } finally {
    globalThis.fetch = original;
    await rm(directory, { recursive: true, force: true });
  }
});

test("Pterodactyl refuses installation when the panel still starts a fixed legacy directory", async () => {
  const adapter = new PterodactylDeployment({
    sameHost: true,
    launcher: "/srv/unicore/updater/launcher.json",
  });
  adapter.request = async (path) => ({
    attributes: path
      ? { current_state: "running" }
      : { invocation: "pnpm run start" },
  });
  await assert.rejects(adapter.preflight(), {
    code: "pterodactyl_launcher_required",
  });
});

test("launcher mapping rejects neighboring paths and plain HTTP panel addresses", async () => {
  assert.throws(
    () =>
      launcherState(
        { pathMap: { host: "/srv/site", container: "/app" } },
        "/srv/site-extra",
        { data: "/srv/site/shared", holdFile: "/srv/site/hold" },
      ),
    { code: "pterodactyl_path" },
  );
  const adapter = new PterodactylDeployment({
    url: "http://panel.example.org",
  });
  await assert.rejects(adapter.request("resources"), {
    code: "pterodactyl_url",
  });
});

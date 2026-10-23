import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PterodactylTransition, pterodactylImages } from "../src/pterodactyl.mjs";
import { nativeEnvironment } from "../src/native-tasks.mjs";

function fixture({ allowed = true, failPower = false } = {}) {
  const calls = [];
  const options = { url: "https://panel.example.org", server: "1234abcd", token: "fixture-token-1234567890" };
  const request = async (url, init) => {
    assert.equal(init.redirect, "error");
    assert.equal(init.headers.Authorization, `Bearer ${options.token}`);
    const path = url.slice(url.indexOf("/servers/") + "/servers/1234abcd".length);
    calls.push({ path, method: init.method, body: init.body && JSON.parse(init.body) });
    if (path === "") return Response.json({ attributes: { name: "Existing site", docker_image: "artemka3112/unicorecms-core:nodejs_22" } });
    if (path === "/startup") return Response.json({ meta: { docker_images: { legacy: "artemka3112/unicorecms-core:nodejs_22", ...(allowed ? { current: pterodactylImages[22] } : {}) } } });
    return new Response(null, { status: path === "/power" && failPower ? 403 : 204 });
  };
  return { transition: new PterodactylTransition(options, request), calls, options };
}
test("Pterodactyl review makes no mutations and blocks unavailable images or stale confirmation", async (t) => {
  const { transition, calls } = fixture();
  const plan = await transition.inspect();
  assert.equal(plan.allowed, true);
  assert(!JSON.stringify(plan).includes("fixture-token"));
  await assert.rejects(transition.apply("stale", tmpdir()), { code: "stale_plan" });
  assert(calls.every((call) => call.method === "GET"));
  const blocked = fixture({ allowed: false });
  const review = await blocked.transition.inspect();
  await assert.rejects(blocked.transition.apply(review.fingerprint, tmpdir()), { code: "pterodactyl_image_unavailable" });
  assert(blocked.calls.every((call) => call.method === "GET"));
});
test("Pterodactyl transition changes only image and restarts, never reinstalls or stores a token", async (t) => {
  const directory = await mkdtemp(join(process.env.TEST_TMPDIR || tmpdir(), "uc-panel-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const { transition, calls, options } = fixture();
  await transition.apply((await transition.inspect()).fingerprint, directory);
  assert.deepEqual(calls.filter((call) => call.method !== "GET"), [
    { path: "/settings/docker-image", method: "PUT", body: { docker_image: pterodactylImages[22] } },
    { path: "/power", method: "POST", body: { signal: "restart" } },
  ]);
  assert(!(await readFile(join(directory, ".unicore-updater-transition.json"), "utf8")).includes(options.token));
});
test("a rejected restart restores the original Pterodactyl image", async (t) => {
  const directory = await mkdtemp(join(process.env.TEST_TMPDIR || tmpdir(), "uc-panel-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const { transition, calls } = fixture({ failPower: true });
  await assert.rejects(transition.apply((await transition.inspect()).fingerprint, directory), { code: "pterodactyl_permission" });
  assert.equal(calls.at(-1).body.docker_image, "artemka3112/unicorecms-core:nodejs_22");
});
test("transition rejects credentials in URLs and native build environments do not inherit application secrets", () => {
  assert.throws(() => new PterodactylTransition({ url: "https://user:pass@panel.example.org", server: "1234abcd", token: "fixture-token-1234567890" }), { code: "pterodactyl_configuration" });
  process.env.UNICORE_TEST_SECRET = "must-not-inherit";
  try { assert.equal(nativeEnvironment().UNICORE_TEST_SECRET, undefined); } finally { delete process.env.UNICORE_TEST_SECRET; }
});

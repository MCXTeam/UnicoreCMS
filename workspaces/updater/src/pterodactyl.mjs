import { atomic, digest, fail } from "./files.mjs";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { join, relative, isAbsolute } from "node:path";

export const pterodactylImages = {
  22: "ghcr.io/mcxteam/unicorecms-pterodactyl:node22",
  24: "ghcr.io/mcxteam/unicorecms-pterodactyl:node24",
};
export class PterodactylTransition {
  constructor({ url, server, token }, request = fetch) {
    const base = new URL(url);
    if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash || !/^[a-zA-Z0-9_-]{8,64}$/.test(server) || !/^[\w.-]{16,512}$/.test(token)) fail("pterodactyl_configuration");
    this.base = base.origin;
    this.server = server;
    this.token = token;
    this.fetch = request;
  }
  async request(path, method = "GET", body, raw = false) {
    const response = await this.fetch(`${this.base}/api/client/servers/${this.server}${path}`, {
      method, redirect: "error", signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${this.token}`, Accept: "application/json", "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) fail(response.status === 403 ? "pterodactyl_permission" : "pterodactyl_http");
    return response.status === 204 ? null : raw ? response.text() : response.json();
  }
  async verifyData(data) {
    const path = relative("/home/container", data);
    if (path.startsWith("..") || isAbsolute(path)) fail("pterodactyl_server_mismatch");
    const name = `.unicore-updater-probe-${randomUUID()}`;
    const proof = randomUUID();
    await atomic(join(data, name), proof);
    try {
      const found = await this.request(`/files/contents?${new URLSearchParams({ file: `/${path ? path + "/" : ""}${name}` })}`, "GET", undefined, true);
      if (found !== proof) fail("pterodactyl_server_mismatch");
    } finally { await rm(join(data, name), { force: true }); }
  }
  async inspect() {
    const details = await this.request("");
    const startup = await this.request("/startup");
    const attributes = details.attributes || {};
    const original = attributes.docker_image;
    const available = Object.values(startup.meta?.docker_images || {});
    const major = /(?:nodejs_|node)(24)(?:\D|$)/.test(original || "") ? 24 : 22;
    const image = pterodactylImages[major];
    const plan = { panel: this.base, server: this.server, name: attributes.name, original, image,
      allowed: available.includes(image) && available.includes(original),
      eggUrl: "https://github.com/MCXTeam/UnicoreCMS-egg-pterodactyl/blob/main/egg-unicore-c-m-s.json" };
    if (typeof original !== "string" || typeof plan.name !== "string") fail("pterodactyl_configuration");
    return { ...plan, fingerprint: digest(plan) };
  }
  async apply(fingerprint, data) {
    const plan = await this.inspect();
    if (!plan.allowed) fail("pterodactyl_image_unavailable");
    if (fingerprint !== plan.fingerprint) fail("stale_plan");
    await atomic(join(data, ".unicore-updater-transition.json"), { ...plan, state: "switching", at: new Date().toISOString() });
    let changed = false;
    try {
      await this.request("/settings/docker-image", "PUT", { docker_image: plan.image });
      changed = true;
      await this.request("/power", "POST", { signal: "restart" });
    } catch (error) {
      if (changed) await this.request("/settings/docker-image", "PUT", { docker_image: plan.original }).catch(() => {});
      await atomic(join(data, ".unicore-updater-transition.json"), { ...plan, state: "failed", at: new Date().toISOString() });
      throw error;
    }
    return { state: "restarting" };
  }
}

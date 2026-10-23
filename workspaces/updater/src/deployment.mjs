import { join, resolve, relative, isAbsolute, dirname } from "node:path";
import { command } from "./merge.mjs";
import { randomUUID } from "node:crypto";
import { atomic, json, exists, fail } from "./files.mjs";

export async function checked(file, args, options) {
  const result = await command(file, args, options);
  if (result.code !== 0)
    throw Object.assign(new Error(`${file}: ${result.code}`), {
      code: "command_failed",
      diagnostic: (result.output.toString() + "\n" + result.errors).slice(
        -32000,
      ),
    });
  return result.output.toString("utf8");
}
export const docker = (...args) => checked("docker", args.flat());
export const processOwner = () =>
  `${process.getuid?.() ?? 0}:${process.getgid?.() ?? 0}`;
export function deploymentPath(config, value) {
  if (!config.pathMap) return value;
  const rel = relative(resolve(config.pathMap.host), resolve(value));
  if (
    rel === ".." ||
    rel.startsWith("../") ||
    rel.startsWith("..\\") ||
    isAbsolute(rel)
  )
    fail("pterodactyl_path");
  return (
    config.pathMap.container.replace(/\/$/, "") +
    (rel ? "/" + rel.replaceAll("\\", "/") : "")
  );
}
export function launcherState(config, root, context) {
  const map = (value) => deploymentPath(config, value);
  return {
    ...context,
    root: map(root),
    data: map(context.data),
    holdFile: map(context.holdFile),
  };
}
const safeId = (value) => {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,100}$/.test(value))
    fail("invalid_resource");
  return value;
};
export class Pm2Deployment {
  constructor(config) {
    this.config = config;
  }
  async preflight() {
    if (!this.config.apps?.length || !this.config.launcher)
      fail("pm2_configuration");
    for (const app of this.config.apps) safeId(app);
    await checked("pm2", ["ping"]);
    const processes = JSON.parse(await checked("pm2", ["jlist"]));
    if (
      this.config.apps.some(
        (name) =>
          !processes.some(
            (p) =>
              p.name === name &&
              p.pm2_env?.pm_exec_path?.endsWith("launcher.mjs") &&
              p.pm2_env?.args?.includes(this.config.launcher),
          ),
      )
    )
      fail("pm2_launcher_required");
  }
  async stop() {
    await checked("pm2", ["stop", ...this.config.apps]);
  }
  async activate(root, context) {
    await atomic(this.config.launcher, { root, ...context });
    await checked("pm2", ["restart", ...this.config.apps, "--update-env"]);
  }
  async open(root, context) {
    await this.activate(root, { ...context, hold: false });
  }
}
export class DockerDeployment {
  constructor(config, directory) {
    this.config = config;
    this.directory = directory;
    safeId(config.container);
  }
  async inspect(name = this.config.container) {
    return JSON.parse(await docker("inspect", name))[0];
  }
  async preflight() {
    await this.inspect();
    if (
      !this.config.arguments ||
      !Array.isArray(this.config.arguments) ||
      this.config.arguments.some((a) => typeof a !== "string") ||
      this.config.arguments.some((a) =>
        /^(--privileged|--pid|--network=host|--volumes-from)/.test(a),
      )
    )
      fail("docker_configuration");
  }
  async stop(op) {
    const snapshot = join(
      this.directory,
      "operations",
      op.id,
      "deployment.json",
    );
    if (!(await exists(snapshot)))
      await atomic(snapshot, {
        original: this.config.container,
        previous: `${this.config.container}-before-${op.id}`,
        image: (await this.inspect()).Config.Image,
      });
    await docker("stop", "--time", "45", this.config.container);
  }
  async activate(root, context, op) {
    const state = await json(
      join(this.directory, "operations", op.id, "deployment.json"),
    );
    await docker("rename", this.config.container, state.previous);
    await this.start(root, context, op.image);
  }
  async start(root, context, image) {
    await docker(
      "run",
      "-d",
      "--init",
      "--user",
      this.config.user || processOwner(),
      "--name",
      this.config.container,
      "--restart",
      "unless-stopped",
      "--cap-drop=ALL",
      "--security-opt=no-new-privileges",
      ...this.config.arguments,
      "--env",
      "UNICORE_UPDATER_EXTERNAL=1",
      "--env",
      `UNICORE_DATA_ROOT=${this.config.dataMount || "/data"}`,
      "--env",
      "UNICORE_CODE_ROOT=/app",
      "--env",
      "UNICORE_UPDATE_HOLD_FILE=/updater/hold",
      "--env",
      "NODE_PATH=/app/node_modules",
      "--mount",
      `type=bind,src=${context.data},dst=${this.config.dataMount || "/data"}`,
      "--mount",
      `type=bind,src=${join(this.directory, "ipc")},dst=/updater,readonly`,
      ...(this.config.bindCode
        ? ["--mount", `type=bind,src=${root},dst=/app,readonly`]
        : []),
      image,
      ...((await exists(join(root, "scripts/start.mjs")))
        ? ["node", "scripts/start.mjs"]
        : ["pnpm", "run", "start"]),
    );
  }
  async open(root, context, op) {
    await docker("rm", "-f", this.config.container);
    await this.start(root, context, op.image);
  }
  async recover(op) {
    const state = await json(
      join(this.directory, "operations", op.id, "deployment.json"),
    );
    const previousExists = await this.inspect(state.previous).then(
      () => true,
      () => false,
    );
    if (previousExists) {
      if (
        await this.inspect().then(
          () => true,
          () => false,
        )
      )
        await docker("rm", "-f", this.config.container);
      await docker("rename", state.previous, this.config.container);
    }
    await docker("start", this.config.container);
  }
  async stopForRecovery() {
    const names = (await docker("ps", "-a", "--format", "{{.Names}}")).trim().split("\n");
    if (names.includes(this.config.container)) await docker("stop", "--time", "45", this.config.container);
  }
}
export class PterodactylDeployment {
  constructor(config) {
    this.config = config;
  }
  async request(path, payload) {
    const base = new URL(this.config.url);
    if (base.protocol !== "https:" || base.username || base.password)
      fail("pterodactyl_url");
    const response = await fetch(
      new URL(
        `/api/client/servers/${encodeURIComponent(this.config.server)}${path ? `/${path}` : ""}`,
        base,
      ),
      {
        method: payload ? "POST" : "GET",
        redirect: "error",
        signal: AbortSignal.timeout(30000),
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      },
    );
    if (!response.ok)
      fail("pterodactyl_http", `Pterodactyl: ${response.status}`);
    return response.status === 204 ? null : response.json();
  }
  async preflight() {
    if (!this.config.launcher || this.config.sameHost !== true)
      fail("pterodactyl_configuration");
    const result = await this.request("resources");
    if (!result.attributes?.current_state) fail("pterodactyl_state");
    const details = await this.request("");
    const invocation = details.attributes?.invocation;
    const entrypoint =
      this.config.entrypoint ||
      join(dirname(this.config.launcher), "runtime/src/start-all.mjs");
    if (
      typeof invocation !== "string" ||
      !invocation.includes(deploymentPath(this.config, entrypoint)) ||
      !invocation.includes(deploymentPath(this.config, this.config.launcher))
    )
      fail("pterodactyl_launcher_required");
  }
  async power(signal, expected) {
    await this.request("power", { signal });
    for (let i = 0; i < 90; i++) {
      if (
        (await this.request("resources")).attributes.current_state === expected
      )
        return;
      await new Promise((r) => setTimeout(r, 1000));
    }
    fail("pterodactyl_timeout");
  }
  async stop() {
    await this.power("stop", "offline");
  }
  async activate(root, context) {
    await atomic(
      this.config.launcher,
      launcherState(this.config, root, context),
    );
    await this.power("start", "running");
  }
  async open(root, context) {
    await this.stop();
    await this.activate(root, { ...context, hold: false });
  }
}
export class SupervisorDeployment {
  constructor(config) {
    this.config = config;
  }
  async preflight() {
    const status = await json(
      join(this.config.directory, "supervisor-status.json"),
    );
    if (Date.now() - status.at > 15000 || status.protocol !== 1)
      fail("supervisor_unavailable");
  }
  async send(payload) {
    const id = randomUUID();
    await atomic(join(this.config.directory, "supervisor-command.json"), {
      id,
      ...payload,
    });
    for (let i = 0; i < 90; i++) {
      const status = await json(
        join(this.config.directory, "supervisor-status.json"),
      );
      if (status.command === id) {
        if (status.error) fail("supervisor_failed");
        return;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    fail("supervisor_timeout");
  }
  async stop() {
    await this.send({ action: "stop" });
  }
  async activate(root, context) {
    await this.send({ action: "start", root, data: context.data });
  }
  async open(root, context) {
    await this.stop();
    await this.activate(root, context);
  }
}

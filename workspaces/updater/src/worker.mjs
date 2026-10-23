import { readFile } from "node:fs/promises";
import { UpdateCoordinator } from "./coordinator.mjs";
import { LocalExecutor } from "./executor.mjs";
import { GitHubReleases, DirectoryReleases } from "./releases.mjs";
import { serve } from "./daemon.mjs";
import { ensureBuilder, setupFile } from "./bootstrap.mjs";
import { json, atomic, exists, fail } from "./files.mjs";
import { join } from "node:path";

const config = await json(process.argv[2]);
const coordinator = new UpdateCoordinator({ ...config,
  source: config.releases.directory ? new DirectoryReleases(config.releases) : new GitHubReleases(config.releases),
  executor: new LocalExecutor(config) });
const server = await serve(coordinator, { ...config.runner, token: (await readFile(config.runner.tokenFile, "utf8")).trim() });
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => server.close(() => process.exit(0)));
let preparing = false;
let ready = false;
async function prepare() {
  if (preparing || ready) return;
  preparing = true;
  await atomic(setupFile(config.data), { state: "preparing" });
  try {
    await ensureBuilder(config);
    const deadline = Date.now() + 300000;
    while (await exists(join(config.directory, "adopting"))) {
      if (Date.now() > deadline) fail("setup_busy");
      await new Promise((done) => setTimeout(done, 1000));
    }
    if (await exists(join(config.directory, "adoption-failed"))) fail("setup_failed");
    await atomic(setupFile(config.data), { state: "ready" });
    ready = true;
  } catch (error) {
    await atomic(setupFile(config.data), { state: "attention", error: ["docker_unavailable", "setup_failed"].includes(error.code) ? error.code : "builder_unavailable" });
  } finally { preparing = false; }
}
await prepare();
setInterval(() => void prepare(), 60000).unref();

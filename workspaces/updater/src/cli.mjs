#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import {
  UpdateCoordinator,
  LocalExecutor,
  GitHubReleases,
  publishBundle,
} from "./index.mjs";
import { serve } from "./daemon.mjs";
import { DirectoryReleases } from "./releases.mjs";
import { json } from "./files.mjs";
import { setup } from "./setup.mjs";
import { createExecutor } from "./executors.mjs";

try {
  const [action, configFile, ...args] = process.argv.slice(2);
  const config = await json(configFile);
  if (action === "setup") {
    console.log(JSON.stringify(await setup(config), null, 2));
  } else if (action === "publish") {
    await publishBundle(
      config.root,
      config.output,
      config.metadata,
      await readFile(process.env.UNICORE_RELEASE_SIGNING_KEY_FILE),
    );
  } else {
    const coordinator = new UpdateCoordinator({
      ...config,
      source: config.releases.directory
        ? new DirectoryReleases(config.releases)
        : new GitHubReleases(config.releases),
      executor: createExecutor(config),
    });
    await coordinator.init();
    if (action === "serve")
      await serve(coordinator, {
        ...config.runner,
        token: await readFile(config.runner.tokenFile, "utf8").then((v) =>
          v.trim(),
        ),
      });
    else if (action === "recover") {
      await coordinator.unlockAfterRestart();
      console.log(JSON.stringify(await coordinator.recover(args[0])));
    } else if (action === "status")
      console.log(JSON.stringify(await coordinator.status(), null, 2));
    else
      throw Object.assign(new Error(), {
        code: "usage: setup|serve|status|recover|publish <config.json>",
      });
  }
} catch (error) {
  console.error(error.code || "updater_failed");
  process.exitCode = 1;
}

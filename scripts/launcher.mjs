import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";
import { ensureInstallation } from "../workspaces/updater/src/bootstrap.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const { paths } = await ensureInstallation(root, process.env.UNICORE_DATA_ROOT || root, { mode: "pm2" });
process.argv[2] = paths.launcher;
await import(pathToFileURL(join(paths.directory, "runtime/src/launcher.mjs")).href);

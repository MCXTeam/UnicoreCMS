import { fileURLToPath } from "node:url";
process.argv[2] = fileURLToPath(new URL("../", import.meta.url));
await import("../workspaces/updater/src/managed.mjs");

import { checked, docker, processOwner } from "./deployment.mjs";
import { fail } from "./files.mjs";

export const taskName = (id, phase) => {
  if (
    !/^[a-f0-9-]{36}$/.test(id) ||
    !["fetch", "build", "migrate", "check", "verify", "backup", "ownership"].includes(phase)
  ) fail("invalid_operation");
  return `unicore-${phase}-${id}`;
};

export async function runTask(id, phase, args, options) {
  const name = taskName(id, phase);
  try {
    return await checked(
      "docker",
      ["run", "--rm", "--init", "--name", name, ...args],
      options,
    );
  } finally {
    await docker("rm", "-f", name).catch(() => {});
  }
}

export async function interruptTasks(id) {
  const names = new Set(
    (await docker("ps", "-a", "--format", "{{.Names}}")).trim().split("\n"),
  );
  for (const phase of ["fetch", "build", "migrate", "check", "verify", "backup", "ownership"]) {
    const name = taskName(id, phase);
    if (names.has(name)) await docker("rm", "-f", name);
  }
}

export async function ownMount(id, mount, image) {
  const owner = processOwner();
  if (owner.startsWith("0:")) return;
  await runTask(id, "ownership", [
    "--network=none", "--read-only", "--user", "0:0",
    "--cap-drop=ALL", "--cap-add=CHOWN", "--cap-add=DAC_OVERRIDE",
    "--mount", mount, image, "chown", "-hR", owner, "/owned",
  ]);
}

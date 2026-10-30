import { randomUUID } from "node:crypto";
import { docker } from "./deployment.mjs";
import { fail } from "./files.mjs";
import { exists } from "./files.mjs";
import { join } from "node:path";

export async function assembleImage(root, builderImage, image) {
  if (await exists(join(root, ".unicore"))) fail("private_license_state_in_image");
  if (![builderImage, image].every((value) => /^[a-zA-Z0-9][a-zA-Z0-9_./:@-]*$/.test(value))) fail("invalid_image");
  const name = `unicore-assembly-${randomUUID()}`;
  await docker("create", "--name", name, "--workdir", "/app", builderImage);
  try {
    await docker("cp", "--archive", `${root}/.`, `${name}:/app`);
    await docker("commit", "--change", 'CMD ["pnpm","run","start"]', name, image);
  } finally {
    await docker("rm", "-f", name).catch(() => {});
  }
}

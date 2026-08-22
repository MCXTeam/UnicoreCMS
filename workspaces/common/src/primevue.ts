import { readdirSync, readFileSync } from "fs";
import { join } from "path";

import { FRONTEND_TEMPLATE_ROOTS, SCAN_SKIP_DIRECTORIES } from "./constants";

export { FRONTEND_TEMPLATE_ROOTS };

export interface PrimevueComponent {
  name?: string;
  from?: string;
}

export interface PrimevueUsageOptions {
  roots: string[];
  components: PrimevueComponent[];
  primevueRoot: string;
}

function templates(directory: string, found: string[]): string[] {
  let entries;

  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    if (directory.endsWith(".vue")) found.push(directory);

    return found;
  }

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!SCAN_SKIP_DIRECTORIES.includes(entry.name)) templates(path, found);
    } else if (entry.name.endsWith(".vue")) found.push(path);
  }

  return found;
}

function read(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function moduleName(from?: string): string {
  return from?.split("/").pop() || "";
}

export function usedPrimevueComponents({
  roots,
  components,
  primevueRoot,
}: PrimevueUsageOptions): string[] {
  const text = roots
    .flatMap((root) => templates(root, []))
    .map(read)
    .join("\n");
  const known = components.filter(
    (component) => component.name && component.from,
  );
  const byModule = new Map(
    known.map((component) => [moduleName(component.from), component]),
  );
  const queue = known.filter((component) =>
    new RegExp(
      `\\b(${component.name}|${kebab(component.name as string)})\\b`,
    ).test(text),
  );
  const used = new Set(queue.map((component) => component.name as string));

  while (queue.length) {
    const component = queue.pop() as PrimevueComponent;
    const source = read(
      join(primevueRoot, moduleName(component.from), "index.mjs"),
    );

    for (const match of source.matchAll(/primevue\/([a-z0-9]+)/g)) {
      const dependency = byModule.get(match[1]);

      if (!dependency || used.has(dependency.name as string)) continue;

      used.add(dependency.name as string);
      queue.push(dependency);
    }
  }

  return [...used].sort();
}

import { resolve, sep } from 'path';

export function containedPath(root: string, relative?: string): string | null {
  if (!relative) return null;

  const path = resolve(root, relative);

  if (path !== root && !path.startsWith(`${root}${sep}`)) return null;

  return path;
}

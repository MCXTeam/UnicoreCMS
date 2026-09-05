import { anyScope, contentTranslationPermissions } from 'unicore-common';
import { Translatable, TranslatableMeta, translatableByEntity, translatableOf } from 'unicore-api';

export { Translatable, translatableByEntity, translatableOf };
export type { TranslatableMeta };

export function translationAccess(entity: string, mode: 'read' | 'write'): string[] {
  const core = contentTranslationPermissions(entity, mode).map((permission) => anyScope(permission));

  if (core.length) return core;

  return translatableByEntity(entity)?.access?.[mode] || [];
}

export function isAllowedPath(meta: TranslatableMeta, path: string): boolean {
  const parts = path.split('.');

  return meta.paths.some((allowed) => {
    const template = allowed.split('.');

    if (template.length !== parts.length) return false;

    return template.every((part, index) => (part === '*' ? /^\d+$/.test(parts[index]) : part === parts[index]));
  });
}

export function getPath(target: any, path: string): unknown {
  return path.split('.').reduce((node, key) => (node == null ? node : node[key]), target);
}

export function setPath(target: any, path: string, value: unknown): void {
  const parts = path.split('.');
  const last = parts.pop() as string;
  let node = target;

  for (const part of parts) {
    if (node == null || typeof node !== 'object') return;
    node = node[part];
  }

  if (node && typeof node === 'object' && last in node) node[last] = value;
}

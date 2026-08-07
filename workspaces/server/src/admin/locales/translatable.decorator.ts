export interface TranslatableMeta {
  entity: string;
  paths: string[];
}

const byTarget = new Map<Function, TranslatableMeta>();
const byEntity = new Map<string, TranslatableMeta>();

export function Translatable(entity: string, paths: string[]): ClassDecorator {
  return (target) => {
    const meta: TranslatableMeta = { entity, paths };

    byTarget.set(target as unknown as Function, meta);
    byEntity.set(entity, meta);
  };
}

export function translatableOf(target: Function): TranslatableMeta | undefined {
  return byTarget.get(target);
}

export function translatableByEntity(entity: string): TranslatableMeta | undefined {
  return byEntity.get(entity);
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

import { permissionEntries, permissionRevision } from "./registry";
import { satisfiesPermission } from "./resolve";

export const PERMISSION_ENTITIES = [
  "user",
  "server",
  "donate_group",
  "donate_permission",
  "store_product",
] as const;

export type PermissionEntity = (typeof PERMISSION_ENTITIES)[number] | (string & {});

let cache: Map<string, Record<string, string>> | null = null;

let cachedRevision = -1;

function index(): Map<string, Record<string, string>> {
  if (cache && cachedRevision === permissionRevision()) return cache;

  cachedRevision = permissionRevision();
  cache = new Map();

  for (const entry of permissionEntries()) {
    if (!entry.field) continue;

    const [entity, ...fields] = entry.field;
    const bound = cache.get(entity) || {};

    for (const field of fields) bound[field] = entry.key;

    cache.set(entity, bound);
  }

  return cache;
}

export function resetFieldPermissions(): void {
  cache = null;
  cachedRevision = -1;
}

export function fieldPermissions(
  entity: PermissionEntity,
): Record<string, string> {
  return index().get(entity) || {};
}

export function fieldPermission(
  entity: PermissionEntity,
  field: string,
): string | null {
  return fieldPermissions(entity)[field] || null;
}

export function guardedFields(entity: PermissionEntity): string[] {
  return Object.keys(fieldPermissions(entity));
}

export function canEditField(
  entity: PermissionEntity,
  field: string,
  granted: string[],
): boolean {
  const permission = fieldPermission(entity, field);

  return !permission || satisfiesPermission(granted, permission);
}

export function forbiddenFields(
  entity: PermissionEntity,
  granted: string[],
): string[] {
  return guardedFields(entity).filter(
    (field) => !canEditField(entity, field, granted),
  );
}

export function stripForbiddenFields<T extends Record<string, any>>(
  entity: PermissionEntity,
  input: T,
  granted: string[],
): T {
  const forbidden = forbiddenFields(entity, granted);

  if (!forbidden.length) return input;

  const result = { ...input };

  for (const field of forbidden) delete result[field];

  return result;
}

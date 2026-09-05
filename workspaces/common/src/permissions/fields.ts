import { permissionEntries, permissionMeta, permissionRevision } from "./registry";
import { satisfiesPermission } from "./resolve";

export const PERMISSION_ENTITIES = [
  "user",
  "server",
  "donate_group",
  "donate_permission",
  "store_product",
  "store_kit",
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

export function isUpdateOnlyField(
  entity: PermissionEntity,
  field: string,
): boolean {
  const permission = fieldPermission(entity, field);

  return Boolean(permission && permissionMeta(permission)?.updateOnly);
}

export function canEditField(
  entity: PermissionEntity,
  field: string,
  granted: string[],
  updating = true,
): boolean {
  const permission = fieldPermission(entity, field);

  if (!permission) return true;
  if (!updating && permissionMeta(permission)?.updateOnly) return true;

  return satisfiesPermission(granted, permission);
}

export function forbiddenFields(
  entity: PermissionEntity,
  granted: string[],
  updating = true,
): string[] {
  return guardedFields(entity).filter(
    (field) => !canEditField(entity, field, granted, updating),
  );
}

export function stripForbiddenFields<T extends Record<string, any>>(
  entity: PermissionEntity,
  input: T,
  granted: string[],
  updating = true,
): T {
  const forbidden = forbiddenFields(entity, granted, updating);

  if (!forbidden.length) return input;

  const result = { ...input };

  for (const field of forbidden) delete result[field];

  return result;
}

import { ForbiddenException } from '@nestjs/common';
import { canEditField, guardedFields, PermissionEntity } from 'unicore-common';
import { grantedPermissions } from './guards/permisson.guard';

const meaningful = (value: unknown): boolean => {
  if (value === undefined || value === null || value === '' || value === false) return false;
  if (typeof value === 'number') return value !== 0;
  if (Array.isArray(value)) return value.length > 0;

  return true;
};

const numeric = (value: unknown): boolean =>
  typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)));

const plainObject = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const same = (left: unknown, right: unknown): boolean => {
  if (left === right) return true;
  if (!meaningful(left) && !meaningful(right)) return true;
  if (numeric(left) && numeric(right)) return Number(left) === Number(right);

  if (plainObject(left) && plainObject(right)) return Object.keys(left).every((key) => same(left[key], right[key]));

  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
};

export async function assertFieldAccess(
  entity: PermissionEntity,
  input: Record<string, any>,
  current: Record<string, any> | null,
  request: any,
): Promise<void> {
  const fields = guardedFields(entity);

  if (!fields.length || !request?.user) return;
  if (request.user.superuser) return;

  const granted = await grantedPermissions(request);

  for (const field of fields) {
    if (canEditField(entity, field, granted)) continue;
    if (!(field in input)) continue;
    if (current ? same(input[field], current[field]) : !meaningful(input[field])) continue;

    throw new ForbiddenException(`Нет права менять поле «${field}»`);
  }
}

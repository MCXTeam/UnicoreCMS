import { canEditField, type PermissionEntity } from 'unicore-common/permissions'
import { useAuthStore } from '~/stores/auth'

export type FieldChecker = (updating?: boolean) => boolean

export function useFieldAccess<T extends Record<string, string>>(
  entity: PermissionEntity,
  map: T,
): Record<keyof T, FieldChecker> {
  const auth = useAuthStore()
  const access = {} as Record<keyof T, FieldChecker>

  for (const key of Object.keys(map) as (keyof T)[]) {
    access[key] = (updating = true): boolean =>
      Boolean(auth.user?.superuser) || canEditField(entity, map[key], auth.user?.perms || [], updating)
  }

  return access
}

import { computed, type ComputedRef } from 'vue'
import { canEditField, type PermissionEntity } from 'unicore-common/permissions'
import { useAuthStore } from '~/stores/auth'

export function useFieldAccess<T extends Record<string, string>>(
  entity: PermissionEntity,
  map: T,
): Record<keyof T, ComputedRef<boolean>> {
  const auth = useAuthStore()
  const access = {} as Record<keyof T, ComputedRef<boolean>>

  for (const key of Object.keys(map) as (keyof T)[]) {
    access[key] = computed(
      () => Boolean(auth.user?.superuser) || canEditField(entity, map[key], auth.user?.perms || []),
    )
  }

  return access
}

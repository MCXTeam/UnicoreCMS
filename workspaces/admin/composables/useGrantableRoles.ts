import { computed } from 'vue'
import { resolvePermissions } from 'unicore-common/permissions'
import { usePermissionCatalog } from '~/composables/usePermissionCatalog'
import { useAuthStore } from '~/stores/auth'

export interface GrantableRole {
  perms?: string[]
}

export function useGrantableRoles() {
  const auth = useAuthStore()
  const { permissions, loaded } = usePermissionCatalog()

  const universe = computed(() => permissions.value.map((entry) => entry.key))

  const granted = computed(() => new Set(resolvePermissions(auth.user?.perms || [], universe.value)))

  return (role: GrantableRole): boolean => {
    if (auth.user?.superuser) return true
    if (!loaded.value || !universe.value.length) return true

    return resolvePermissions(role.perms || [], universe.value).every((permission) => granted.value.has(permission))
  }
}

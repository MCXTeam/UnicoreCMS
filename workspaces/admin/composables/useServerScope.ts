import { computed, type ComputedRef } from 'vue'
import { satisfiesPermission } from 'unicore-common/permissions'
import { useAuthStore } from '~/stores/auth'

export interface ScopedServer {
  id: string
}

export function useServerScope(permission: string): ComputedRef<string[] | null> {
  const auth = useAuthStore()

  return computed(() => {
    if (auth.user?.superuser) return null

    const perms = auth.user?.perms || []

    if (satisfiesPermission(perms, permission)) return null

    const prefix = `${permission}.`

    return perms.filter((perm) => perm.startsWith(prefix) && !perm.includes('*')).map((perm) => perm.slice(prefix.length))
  })
}

export function scopedServers<T extends ScopedServer>(servers: T[], allowed: string[] | null): T[] {
  if (!allowed) return servers

  return servers.filter((server) => allowed.includes(server.id))
}

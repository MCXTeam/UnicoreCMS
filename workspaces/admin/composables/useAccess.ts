import { computed, type ComputedRef } from 'vue'
import { anyScope } from 'unicore-common/permissions'
import { useAuthStore } from '~/stores/auth'

export type ServerRef = string | { id: string }

export type ServerScopeArg = ServerRef | ServerRef[] | null | undefined

export type ScopedChecker = (servers?: ServerScopeArg) => boolean

function serverIds(servers: ServerScopeArg): string[] {
  if (!servers) return []

  const list = Array.isArray(servers) ? servers : [servers]

  return list.map((server) => (typeof server === 'string' ? server : server?.id)).filter(Boolean) as string[]
}

export function useAccess<T extends Record<string, string>>(map: T): Record<keyof T, ComputedRef<boolean>> {
  const auth = useAuthStore()
  const access = {} as Record<keyof T, ComputedRef<boolean>>

  for (const key of Object.keys(map) as (keyof T)[]) {
    access[key] = computed(() => auth.has(anyScope(map[key])))
  }

  return access
}

export function useScopedAccess<T extends Record<string, string>>(map: T): Record<keyof T, ScopedChecker> {
  const auth = useAuthStore()
  const scoped = {} as Record<keyof T, ScopedChecker>

  for (const key of Object.keys(map) as (keyof T)[]) {
    scoped[key] = (servers?: ServerScopeArg): boolean => {
      const permission = map[key]

      if (auth.has(permission)) return true

      return serverIds(servers).some((id) => auth.has(`${permission}.${id}`))
    }
  }

  return scoped
}

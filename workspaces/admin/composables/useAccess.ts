import { computed, type ComputedRef } from 'vue'
import { useAuthStore } from '~/stores/auth'

export function useAccess<T extends Record<string, string>>(map: T): Record<keyof T, ComputedRef<boolean>> {
  const auth = useAuthStore()
  const access = {} as Record<keyof T, ComputedRef<boolean>>

  for (const key of Object.keys(map) as (keyof T)[]) {
    access[key] = computed(() => auth.has(map[key]))
  }

  return access
}

import type { PermissionEntry } from 'unicore-common/permissions'
import { permissionGroupKey, permissionHintKey, permissionLabelKey } from 'unicore-common/permissions'
import { useMessages } from '~/composables/useLocale'

export interface PermissionScopeOption {
  id: string
  name: string
}

export interface PermissionGroupView {
  group: string
  label: string
  permissions: PermissionEntry[]
}

export function usePermissionCatalog() {
  const permissions = useState<PermissionEntry[]>('permission-catalog', () => [])
  const servers = useState<PermissionScopeOption[]>('permission-scopes', () => [])
  const loaded = useState<boolean>('permission-catalog-loaded', () => false)
  const messages = useMessages()

  const { $api, $t } = useNuxtApp() as any

  async function load(force = false) {
    if (loaded.value && !force) return

    const { data } = await $api.get('/admin/permissions/catalog')

    permissions.value = data.permissions || []
    servers.value = data.servers || []
    loaded.value = true
  }

  const label = (key: string): string => {
    const locale = permissionLabelKey(key)

    return messages.value[locale] ?? key
  }

  const hint = (key: string): string => {
    const locale = permissionHintKey(key)

    return messages.value[locale] ?? ''
  }

  const groupLabel = (group: string): string => {
    const locale = permissionGroupKey(group)

    return messages.value[locale] ?? group
  }

  const groups = computed<PermissionGroupView[]>(() => {
    const order: string[] = []
    const buckets = new Map<string, PermissionEntry[]>()

    for (const entry of permissions.value) {
      if (!buckets.has(entry.group)) {
        buckets.set(entry.group, [])
        order.push(entry.group)
      }

      buckets.get(entry.group)!.push(entry)
    }

    return order.map((group) => ({ group, label: groupLabel(group), permissions: buckets.get(group)! }))
  })

  return { permissions, servers, groups, load, label, hint, groupLabel, t: $t }
}

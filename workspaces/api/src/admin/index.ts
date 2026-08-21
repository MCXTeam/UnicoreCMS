export interface AdminMenuItem {
  label: string
  icon?: string
  to?: string
  items?: AdminMenuItem[]
}

export interface AdminMenuGroup {
  label: string
  items: AdminMenuItem[]
}

export type AdminRouteAccess = 'superuser' | string[]

export interface AdminSlotEntry {
  slot: string
  component: string
  order?: number
}

export interface AdminModuleDefinition {
  id: string
  menu?: AdminMenuItem[]
  group?: string
  access?: Record<string, AdminRouteAccess>
  slots?: AdminSlotEntry[]
}

const KEY = Symbol.for('unicore.api.admin.registry.v1')

const store = (): Map<string, AdminModuleDefinition> => {
  const holder = globalThis as unknown as Record<symbol, Map<string, AdminModuleDefinition> | undefined>

  if (!holder[KEY]) holder[KEY] = new Map()

  return holder[KEY] as Map<string, AdminModuleDefinition>
}

export const defineAdminModule = (definition: AdminModuleDefinition): AdminModuleDefinition => {
  store().set(definition.id, definition)

  return definition
}

export const adminModules = (): AdminModuleDefinition[] => [...store().values()]

export const adminMenu = (): AdminMenuItem[] => adminModules().flatMap((item) => item.menu || [])

export const adminAccess = (): Record<string, AdminRouteAccess> =>
  adminModules().reduce<Record<string, AdminRouteAccess>>((result, item) => ({ ...result, ...(item.access || {}) }), {})

export const adminSlots = (slot: string): AdminSlotEntry[] =>
  adminModules()
    .flatMap((item) => item.slots || [])
    .filter((item) => item.slot === slot)
    .sort((a, b) => (a.order || 100) - (b.order || 100))

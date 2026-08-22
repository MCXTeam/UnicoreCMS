import { warnUnknown } from '../warn'

export const ADMIN_SLOTS = ['dashboard', 'users.profile'] as const

export type AdminSlotName = (typeof ADMIN_SLOTS)[number]

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

export type SlotComponent = string | object

export interface AdminSlotEntry {
  slot: AdminSlotName
  component: SlotComponent
  order?: number
}

export interface AdminModuleDefinition {
  id: string
  menu?: AdminMenuItem[]
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
  for (const entry of definition.slots || [])
    warnUnknown(ADMIN_SLOTS, entry.slot, `[unicore] модуль «${definition.id}» указал неизвестный слот «${entry.slot}»`)

  store().set(definition.id, definition)

  return definition
}

export const adminModules = (): AdminModuleDefinition[] => [...store().values()]

export const adminMenu = (): AdminMenuItem[] => adminModules().flatMap((item) => item.menu || [])

export const adminAccess = (): Record<string, AdminRouteAccess> =>
  adminModules().reduce<Record<string, AdminRouteAccess>>((result, item) => ({ ...result, ...(item.access || {}) }), {})

export const adminSlots = (slot: AdminSlotName): AdminSlotEntry[] =>
  adminModules()
    .flatMap((item) => item.slots || [])
    .filter((item) => item.slot === slot)
    .sort((a, b) => (a.order || 100) - (b.order || 100))

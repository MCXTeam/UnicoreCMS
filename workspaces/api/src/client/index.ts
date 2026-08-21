import { warnUnknown } from '../warn'

export const CLIENT_NAV_PLACES = [
  'navbar',
  'footer',
  'cabinet',
  'cabinet.tabs',
  'store.tabs',
  'players.tabs',
] as const

export const CLIENT_SLOTS = [
  'home.top',
  'home.bottom',
  'footer',
  'servers.list',
  'server.page',
  'news.page',
  'user.profile',
  'start.page',
  'cabinet.index',
  'store.catalog',
  'store.product',
  'donate.index',
  'donate.server',
] as const

export type ClientNavPlace = (typeof CLIENT_NAV_PLACES)[number]

export type ClientSlotName = (typeof CLIENT_SLOTS)[number]

export interface ClientNavItem {
  key: string
  to: string
  label: string
  icon?: string
  when?: 'always' | 'auth' | 'guest'
  places?: ClientNavPlace[]
  order?: number
}

export type SlotComponent = string | object

export interface ClientSlotEntry {
  slot: ClientSlotName
  component: SlotComponent
  order?: number
  when?: 'always' | 'auth' | 'guest'
}

export interface ClientModuleDefinition {
  id: string
  nav?: ClientNavItem[]
  slots?: ClientSlotEntry[]
}

const KEY = Symbol.for('unicore.api.client.registry.v1')

const store = (): Map<string, ClientModuleDefinition> => {
  const holder = globalThis as unknown as Record<symbol, Map<string, ClientModuleDefinition> | undefined>

  if (!holder[KEY]) holder[KEY] = new Map()

  return holder[KEY] as Map<string, ClientModuleDefinition>
}

export const defineClientModule = (definition: ClientModuleDefinition): ClientModuleDefinition => {
  for (const item of definition.nav || [])
    for (const place of item.places || [])
      warnUnknown(CLIENT_NAV_PLACES, place, `[unicore] модуль «${definition.id}» указал неизвестное место навигации «${place}»`)

  for (const entry of definition.slots || [])
    warnUnknown(CLIENT_SLOTS, entry.slot, `[unicore] модуль «${definition.id}» указал неизвестный слот «${entry.slot}»`)

  store().set(definition.id, definition)

  return definition
}

export const clientModules = (): ClientModuleDefinition[] => [...store().values()]

export const clientNav = (place: ClientNavPlace): ClientNavItem[] =>
  clientModules()
    .flatMap((item) => item.nav || [])
    .filter((item) => !item.places || item.places.includes(place))
    .sort((a, b) => (a.order || 100) - (b.order || 100))

export const clientSlots = (slot: ClientSlotName): ClientSlotEntry[] =>
  clientModules()
    .flatMap((item) => item.slots || [])
    .filter((item) => item.slot === slot)
    .sort((a, b) => (a.order || 100) - (b.order || 100))

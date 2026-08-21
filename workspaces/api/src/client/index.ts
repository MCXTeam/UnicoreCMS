export interface ClientNavItem {
  key: string
  to: string
  label: string
  icon?: string
  when?: 'always' | 'auth' | 'guest'
  places?: ('navbar' | 'cabinet' | 'footer')[]
  order?: number
}

export interface ClientSlotEntry {
  slot: string
  component: string
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
  store().set(definition.id, definition)

  return definition
}

export const clientModules = (): ClientModuleDefinition[] => [...store().values()]

export const clientNav = (place: ClientNavItem['places'] extends (infer T)[] | undefined ? T : never): ClientNavItem[] =>
  clientModules()
    .flatMap((item) => item.nav || [])
    .filter((item) => !item.places || item.places.includes(place))
    .sort((a, b) => (a.order || 100) - (b.order || 100))

export const clientSlots = (slot: string): ClientSlotEntry[] =>
  clientModules()
    .flatMap((item) => item.slots || [])
    .filter((item) => item.slot === slot)
    .sort((a, b) => (a.order || 100) - (b.order || 100))

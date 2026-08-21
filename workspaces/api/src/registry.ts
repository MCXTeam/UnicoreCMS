import { API_VERSION } from './version'
import { Capabilities } from './capabilities'
import { EventBus } from './events'
import { ConfigFieldSchema } from './manifest'

export interface ModuleContribution {
  id: string
  entities: unknown[]
  nestModules: unknown[]
  permissions: string[]
  config: ConfigFieldSchema[]
  locales: Record<string, Record<string, string>>
  paymentModules: unknown[]
  webhookChannels: unknown[]
  setup?: (context: unknown) => void | Promise<void>
}

export interface Registry {
  apiVersion: string
  events: EventBus
  capabilities: Capabilities
  core: unknown | null
  modules: Map<string, ModuleContribution>
}

const KEY = Symbol.for('unicore.api.registry.v1')

const create = (): Registry => ({
  apiVersion: API_VERSION,
  events: new EventBus(),
  capabilities: new Capabilities(),
  core: null,
  modules: new Map(),
})

export const getRegistry = (): Registry => {
  const holder = globalThis as unknown as Record<symbol, Registry | undefined>
  const existing = holder[KEY]

  if (!existing) {
    holder[KEY] = create()

    return holder[KEY] as Registry
  }

  if (existing.apiVersion !== API_VERSION)
    throw new Error(
      `Обнаружены две несовместимые копии unicore-api: ${existing.apiVersion} и ${API_VERSION}. ` +
        'Модуль не должен включать unicore-api в свою сборку.',
    )

  return existing
}

export const registerContribution = (contribution: ModuleContribution): void => {
  const registry = getRegistry()

  if (registry.modules.has(contribution.id)) throw new Error(`Модуль «${contribution.id}» уже зарегистрирован`)

  registry.modules.set(contribution.id, contribution)
}

export const contributions = (): ModuleContribution[] => [...getRegistry().modules.values()]

export const contribution = (id: string): ModuleContribution | undefined => getRegistry().modules.get(id)

export const events = (): EventBus => getRegistry().events

export const capabilities = (): Capabilities => getRegistry().capabilities

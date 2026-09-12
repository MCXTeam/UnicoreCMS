import { ModuleAuditAction, ModuleAuditClassDefinition } from '../audit'
import { ConfigFieldSchema, ModulePermission } from '../manifest'
import { getRegistry, ModuleContribution, registerContribution } from '../registry'
import { EventBus } from '../events'
import { HookBus } from '../hooks'
import { Capabilities } from '../capabilities'
import { core, coreReady } from './core'
import { CoreApi, LoggerApi } from './types'

export interface ModuleContext {
  id: string
  events: EventBus
  hooks: HookBus
  capabilities: Capabilities
  logger: LoggerApi
  core: () => CoreApi
}

export interface ModuleDefinition {
  id: string
  entities?: unknown[]
  nestModules?: unknown[]
  permissions?: ModulePermission[]
  auditActions?: ModuleAuditAction[]
  auditClasses?: ModuleAuditClassDefinition[]
  config?: ConfigFieldSchema[]
  locales?: Record<string, Record<string, string>>
  paymentModules?: unknown[]
  webhookChannels?: unknown[]
  setup?: (context: ModuleContext) => void | Promise<void>
}

export const defineModule = (definition: ModuleDefinition): ModuleDefinition => {
  const contribution: ModuleContribution = {
    id: definition.id,
    entities: definition.entities || [],
    nestModules: definition.nestModules || [],
    permissions: definition.permissions || [],
    auditActions: definition.auditActions || [],
    auditClasses: definition.auditClasses || [],
    config: definition.config || [],
    locales: definition.locales || {},
    paymentModules: definition.paymentModules || [],
    webhookChannels: definition.webhookChannels || [],
    setup: definition.setup as ModuleContribution['setup'],
  }

  registerContribution(contribution)

  return definition
}

export const moduleContext = (id: string): ModuleContext => {
  const registry = getRegistry()

  return {
    id,
    events: registry.events,
    hooks: registry.hooks,
    capabilities: registry.capabilities,
    logger: coreReady()
      ? core().logger(id)
      : {
          log: () => undefined,
          warn: () => undefined,
          error: () => undefined,
          debug: () => undefined,
        },
    core,
  }
}

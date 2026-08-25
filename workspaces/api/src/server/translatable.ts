export interface TranslatableAccess {
  read?: string[]
  write?: string[]
}

export interface TranslatableMeta {
  entity: string
  paths: string[]
  access?: TranslatableAccess
}

interface TranslatableRegistry {
  byTarget: Map<Function, TranslatableMeta>
  byEntity: Map<string, TranslatableMeta>
}

const KEY = Symbol.for('unicore.api.translatable.registry.v1')

const registry = (): TranslatableRegistry => {
  const holder = globalThis as unknown as Record<symbol, TranslatableRegistry | undefined>

  if (!holder[KEY]) holder[KEY] = { byTarget: new Map(), byEntity: new Map() }

  return holder[KEY] as TranslatableRegistry
}

export const Translatable = (entity: string, paths: string[], access?: TranslatableAccess): ClassDecorator => {
  return (target) => {
    const meta: TranslatableMeta = { entity, paths, access }

    registry().byTarget.set(target as unknown as Function, meta)
    registry().byEntity.set(entity, meta)
  }
}

export const translatableOf = (target: Function): TranslatableMeta | undefined => registry().byTarget.get(target)

export const translatableByEntity = (entity: string): TranslatableMeta | undefined => registry().byEntity.get(entity)

export const translatableEntities = (): TranslatableMeta[] => [...registry().byEntity.values()]

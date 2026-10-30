import { assertModuleLicense, requireModuleLicense } from 'unicore-api/licensing'

export { assertModuleLicense, requireModuleLicense }

const GUARDED = Symbol.for('unicore.license.guarded.v1')

export const LicensedModule =
  (id: string): ClassDecorator =>
  (target) => {
    Reflect.defineMetadata('unicore:license:module', id, target)
    for (const name of Object.getOwnPropertyNames(target.prototype)) {
      if (name === 'constructor') continue
      const descriptor = Object.getOwnPropertyDescriptor(target.prototype, name)
      const original = descriptor?.value
      if (typeof original !== 'function' || original[GUARDED]) continue
      const guarded = function (this: unknown, ...args: unknown[]) {
        if (['onModuleDestroy', 'beforeApplicationShutdown', 'onApplicationShutdown'].includes(name))
          return Reflect.apply(original, this, args)
        if (['onModuleInit', 'onApplicationBootstrap'].includes(name)) {
          try {
            assertModuleLicense(id)
          } catch {
            return
          }
          return Reflect.apply(original, this, args)
        }
        assertModuleLicense(id)
        return Reflect.apply(original, this, args)
      }
      for (const key of Reflect.getMetadataKeys(original)) Reflect.defineMetadata(key, Reflect.getMetadata(key, original), guarded)
      Object.defineProperty(guarded, GUARDED, { value: true })
      Object.defineProperty(target.prototype, name, { ...descriptor, value: guarded })
    }
  }

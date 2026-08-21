import { getRegistry } from '../registry'
import { CoreApi } from './types'

export class UnicoreApiNotReadyError extends Error {
  constructor() {
    super('Ядро UnicoreCMS ещё не готово. Обращайтесь к api.core внутри onModuleInit или после события core.ready.')
  }
}

export const setCore = (core: CoreApi): void => {
  getRegistry().core = core
}

export const coreReady = (): boolean => Boolean(getRegistry().core)

export const core = (): CoreApi => {
  const instance = getRegistry().core as CoreApi | null

  if (!instance) throw new UnicoreApiNotReadyError()

  return instance
}

import { moduleActive } from './index'

export interface AdminFormRecord {
  id: string | number | null
  mode: 'create' | 'edit'
  value: Readonly<Record<string, unknown>>
}

export interface AdminSavedFormRecord extends AdminFormRecord {
  id: string | number
  mode: 'edit'
}

export interface AdminFormParticipant {
  load?(record: AdminFormRecord): void | Promise<void>
  validate?(record: AdminFormRecord): void | Promise<void>
  save?(record: AdminSavedFormRecord): void | Promise<void>
  reset?(): void
}

export interface AdminFormContext {
  readonly resource: string
  readonly record: AdminFormRecord
  readonly signal: AbortSignal
  register(moduleId: string, participant: AdminFormParticipant): () => void
}

export type AdminFormPhase = 'load' | 'validate' | 'save'

export class AdminFormError extends Error {
  readonly moduleId: string
  readonly phase: AdminFormPhase
  readonly cause: unknown

  constructor(moduleId: string, phase: AdminFormPhase, cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause))
    this.name = 'AdminFormError'
    this.moduleId = moduleId
    this.phase = phase
    this.cause = cause
  }
}

export interface AdminFormController {
  readonly context: AdminFormContext
  load(): Promise<void>
  validate(): Promise<void>
  save(): Promise<void>
  dispose(): void
}

export function createAdminForm(resource: string, record: () => AdminFormRecord): AdminFormController {
  const abort = new AbortController()
  const participants = new Map<string, { participant: AdminFormParticipant; loaded: boolean }>()

  const context: AdminFormContext = {
    resource,
    get record() { return record() },
    signal: abort.signal,
    register(moduleId, participant) {
      if (abort.signal.aborted) return () => undefined
      if (participants.has(moduleId)) throw new Error(`Модуль «${moduleId}» уже зарегистрирован в форме «${resource}»`)

      const entry = { participant, loaded: false }
      participants.set(moduleId, entry)

      return () => {
        if (participants.get(moduleId) === entry) participants.delete(moduleId)
      }
    },
  }

  async function run(phase: AdminFormPhase) {
    for (const [moduleId, entry] of [...participants]) {
      if (abort.signal.aborted) return
      if (participants.get(moduleId) !== entry || !moduleActive(moduleId)) continue
      if (phase === 'load' && entry.loaded) continue

      try {
        const current = record()
        if (phase === 'save') {
          if (current.id == null) throw new Error('Сначала сохраните основную запись')
          await entry.participant.save?.({ ...current, id: current.id, mode: 'edit' })
        } else {
          await entry.participant[phase]?.(current)
        }
        if (abort.signal.aborted) return
        if (phase === 'load') entry.loaded = true
      } catch (error) {
        if (abort.signal.aborted) return
        throw new AdminFormError(moduleId, phase, error)
      }
    }
  }

  return {
    context,
    load: () => run('load'),
    async validate() {
      await run('load')
      await run('validate')
    },
    save: () => run('save'),
    dispose() {
      if (abort.signal.aborted) return
      abort.abort()
      for (const [moduleId, entry] of [...participants].reverse()) {
        try {
          entry.participant.reset?.()
        } catch (error) {
          console.warn(`[unicore] Не удалось сбросить форму модуля «${moduleId}»`, error)
        }
      }
      participants.clear()
    },
  }
}

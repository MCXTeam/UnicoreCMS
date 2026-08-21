import { MODULE_ID_PATTERN, THEME_ID_PATTERN } from './keys'

export type ConfigFieldType = 'string' | 'number' | 'boolean' | 'select'

export interface ConfigFieldSchema {
  key: string
  type: ConfigFieldType
  default?: string | number | boolean
  public?: boolean
  min?: number
  max?: number
  options?: { value: string; label: string }[]
  label?: string
  hint?: string
}

export type LocalizedText = string | Record<string, string>

export interface ModuleManifest {
  id: string
  name: LocalizedText
  version: string
  unicoreApi: string
  description?: LocalizedText
  author?: string
  homepage?: string
  license?: string
  server?: string
  client?: string
  admin?: string
  componentPrefix?: string
  locales?: string
  permissions?: string[]
  config?: ConfigFieldSchema[]
  requires?: { modules?: Record<string, string> }
}

export interface ThemeManifest {
  id: string
  name: LocalizedText
  version: string
  unicoreApi: string
  side?: 'client' | 'admin'
  componentPrefix?: string
  primevue?: string
  tokens?: string
  author?: string
  homepage?: string
  pages?: {
    replace?: Record<string, string>
    remove?: string[]
  }
}

export interface ValidationResult<T> {
  manifest: T | null
  errors: string[]
}

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+].+)?$/

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const validateName = (value: unknown, errors: string[]): void => {
  if (typeof value === 'string' && value.trim()) return
  if (isRecord(value) && Object.values(value).every((item) => typeof item === 'string')) return

  errors.push('поле name должно быть строкой или объектом переводов')
}

const validateConfigField = (field: unknown, index: number, errors: string[]): void => {
  if (!isRecord(field)) {
    errors.push(`config[${index}] должен быть объектом`)
    return
  }

  if (typeof field.key !== 'string' || !/^[a-z][a-z0-9_]*$/.test(field.key))
    errors.push(`config[${index}].key должен быть строкой в нижнем регистре`)

  if (!['string', 'number', 'boolean', 'select'].includes(String(field.type)))
    errors.push(`config[${index}].type должен быть string, number, boolean или select`)

  if (field.type === 'select' && !Array.isArray(field.options)) errors.push(`config[${index}].options обязателен для типа select`)
}

export const validateModuleManifest = (raw: unknown): ValidationResult<ModuleManifest> => {
  const errors: string[] = []

  if (!isRecord(raw)) return { manifest: null, errors: ['манифест должен быть объектом'] }

  if (typeof raw.id !== 'string' || !MODULE_ID_PATTERN.test(raw.id))
    errors.push('поле id должно соответствовать шаблону [a-z][a-z0-9_]{2,31}')

  validateName(raw.name, errors)

  if (typeof raw.version !== 'string' || !SEMVER_PATTERN.test(raw.version)) errors.push('поле version должно быть версией вида 1.0.0')

  if (typeof raw.unicoreApi !== 'string' || !raw.unicoreApi.trim()) errors.push('поле unicoreApi обязательно и задаёт диапазон версий API')

  for (const key of ['server', 'client', 'admin', 'locales', 'componentPrefix'] as const)
    if (raw[key] !== undefined && typeof raw[key] !== 'string') errors.push(`поле ${key} должно быть строкой`)

  if (raw.permissions !== undefined) {
    if (!Array.isArray(raw.permissions)) errors.push('поле permissions должно быть массивом строк')
    else
      raw.permissions.forEach((item, index) => {
        if (typeof item !== 'string') errors.push(`permissions[${index}] должен быть строкой`)
      })
  }

  if (raw.config !== undefined) {
    if (!Array.isArray(raw.config)) errors.push('поле config должно быть массивом')
    else raw.config.forEach((field, index) => validateConfigField(field, index, errors))
  }

  if (typeof raw.componentPrefix === 'string' && !/^[A-Z][A-Za-z0-9]*$/.test(raw.componentPrefix))
    errors.push('поле componentPrefix должно начинаться с заглавной буквы')

  return { manifest: errors.length ? null : (raw as unknown as ModuleManifest), errors }
}

export const validateThemeManifest = (raw: unknown): ValidationResult<ThemeManifest> => {
  const errors: string[] = []

  if (!isRecord(raw)) return { manifest: null, errors: ['манифест должен быть объектом'] }

  if (typeof raw.id !== 'string' || !THEME_ID_PATTERN.test(raw.id))
    errors.push('поле id должно соответствовать шаблону [a-z][a-z0-9_]{2,31}')

  validateName(raw.name, errors)

  if (typeof raw.version !== 'string' || !SEMVER_PATTERN.test(raw.version)) errors.push('поле version должно быть версией вида 1.0.0')

  if (typeof raw.unicoreApi !== 'string' || !raw.unicoreApi.trim()) errors.push('поле unicoreApi обязательно и задаёт диапазон версий API')

  if (raw.side !== undefined && !['client', 'admin'].includes(String(raw.side))) errors.push('поле side должно быть client или admin')

  return { manifest: errors.length ? null : (raw as unknown as ThemeManifest), errors }
}

export const localizedText = (value: LocalizedText | undefined, locale: string, fallback = ''): string => {
  if (!value) return fallback
  if (typeof value === 'string') return value

  return value[locale] || value.ru || value.en || Object.values(value)[0] || fallback
}

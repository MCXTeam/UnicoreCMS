import type { ConfigFieldSchema, LocalizedText } from './manifest'

export interface SettingsField extends ConfigFieldSchema {
  value: string | null
  category: string
  moduleId?: string
}

export interface SettingsCategory {
  id: string
  label: LocalizedText
  hint?: string
  icon?: string
}

export interface SettingsCatalog {
  categories: SettingsCategory[]
  fields: SettingsField[]
}

export interface SettingsChange {
  key: string
  value: string | null
  expected: string | null
}

export function settingIssue(field: ConfigFieldSchema, value: unknown): string | null {
  if (value !== null && typeof value !== 'string') return 'settings.error.type'
  const text = value as string | null
  if (text === null || text.trim() === '') {
    if (field.required || field.type === 'number' || field.type === 'boolean') return 'settings.error.required'
    return null
  }
  if (field.type === 'boolean' && !['true', 'false', '0', '1'].includes(text)) return 'settings.error.boolean'
  if (field.type === 'number') {
    const number = Number(text)
    if (!Number.isFinite(number)) return 'settings.error.number'
    if (field.integer && !Number.isInteger(number)) return 'settings.error.integer'
    if (field.min !== undefined && number < field.min) return 'settings.error.min'
    if (field.max !== undefined && number > field.max) return 'settings.error.max'
  }
  if (field.type === 'select' && !field.options?.some((option) => option.value === text)) return 'settings.error.option'
  if (field.maxLength !== undefined && text.length > field.maxLength) return 'settings.error.length'
  if (field.input === 'url' || field.input === 'image') {
    if (text !== text.trim() || /[\s<>"\\]/.test(text)) return 'settings.error.url'
    if (text.startsWith('/') && !text.startsWith('//')) return null
    try {
      const url = new URL(text)
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return 'settings.error.url'
    } catch {
      return 'settings.error.url'
    }
  }
  return null
}

export type FieldSetting = 'min' | 'max' | 'step' | 'min_length' | 'max_length' | 'pattern' | 'rows' | 'accept' | 'max_size' | 'stars'

export interface FieldTypeInfo {
  type: string
  label: string
  icon: string
  input: boolean
  options: boolean
  multi: boolean
  settings: FieldSetting[]
}

export const FIELD_TYPES: FieldTypeInfo[] = [
  { type: 'text', label: 'mod.forms.type_text', icon: 'pi pi-pencil', input: true, options: false, multi: false, settings: ['min_length', 'max_length', 'pattern'] },
  { type: 'textarea', label: 'mod.forms.type_textarea', icon: 'pi pi-align-left', input: true, options: false, multi: false, settings: ['min_length', 'max_length', 'rows'] },
  { type: 'number', label: 'mod.forms.type_number', icon: 'pi pi-hashtag', input: true, options: false, multi: false, settings: ['min', 'max', 'step'] },
  { type: 'email', label: 'mod.forms.type_email', icon: 'pi pi-envelope', input: true, options: false, multi: false, settings: [] },
  { type: 'url', label: 'mod.forms.type_url', icon: 'pi pi-link', input: true, options: false, multi: false, settings: [] },
  { type: 'select', label: 'mod.forms.type_select', icon: 'pi pi-chevron-down', input: true, options: true, multi: false, settings: [] },
  { type: 'multiselect', label: 'mod.forms.type_multiselect', icon: 'pi pi-list', input: true, options: true, multi: true, settings: ['min', 'max'] },
  { type: 'radio', label: 'mod.forms.type_radio', icon: 'pi pi-circle', input: true, options: true, multi: false, settings: [] },
  { type: 'checkboxes', label: 'mod.forms.type_checkboxes', icon: 'pi pi-check-square', input: true, options: true, multi: true, settings: ['min', 'max'] },
  { type: 'checkbox', label: 'mod.forms.type_checkbox', icon: 'pi pi-check', input: true, options: false, multi: false, settings: [] },
  { type: 'switch', label: 'mod.forms.type_switch', icon: 'pi pi-power-off', input: true, options: false, multi: false, settings: [] },
  { type: 'date', label: 'mod.forms.type_date', icon: 'pi pi-calendar', input: true, options: false, multi: false, settings: [] },
  { type: 'slider', label: 'mod.forms.type_slider', icon: 'pi pi-sliders-h', input: true, options: false, multi: false, settings: ['min', 'max', 'step'] },
  { type: 'rating', label: 'mod.forms.type_rating', icon: 'pi pi-star', input: true, options: false, multi: false, settings: ['stars'] },
  { type: 'server', label: 'mod.forms.type_server', icon: 'pi pi-server', input: true, options: false, multi: false, settings: [] },
  { type: 'file', label: 'mod.forms.type_file', icon: 'pi pi-paperclip', input: true, options: false, multi: false, settings: ['accept', 'max_size'] },
  { type: 'heading', label: 'mod.forms.type_heading', icon: 'pi pi-bookmark', input: false, options: false, multi: false, settings: [] },
  { type: 'paragraph', label: 'mod.forms.type_paragraph', icon: 'pi pi-comment', input: false, options: false, multi: false, settings: [] },
  { type: 'divider', label: 'mod.forms.type_divider', icon: 'pi pi-minus', input: false, options: false, multi: false, settings: [] },
]

export const fieldType = (type: string): FieldTypeInfo => FIELD_TYPES.find((item) => item.type === type) || FIELD_TYPES[0]

export const CONDITION_OPERATORS = [
  { value: 'filled', label: 'mod.forms.op_filled', value_needed: false },
  { value: 'empty', label: 'mod.forms.op_empty', value_needed: false },
  { value: 'eq', label: 'mod.forms.op_eq', value_needed: true },
  { value: 'ne', label: 'mod.forms.op_ne', value_needed: true },
  { value: 'contains', label: 'mod.forms.op_contains', value_needed: true },
  { value: 'gt', label: 'mod.forms.op_gt', value_needed: true },
  { value: 'lt', label: 'mod.forms.op_lt', value_needed: true },
]

export const SUBMISSION_STATUSES = [
  { value: 'new', label: 'mod.forms.status_new', severity: 'info', icon: 'pi pi-inbox' },
  { value: 'review', label: 'mod.forms.status_review', severity: 'warn', icon: 'pi pi-eye' },
  { value: 'accepted', label: 'mod.forms.status_accepted', severity: 'success', icon: 'pi pi-check' },
  { value: 'rejected', label: 'mod.forms.status_rejected', severity: 'danger', icon: 'pi pi-times' },
]

export const submissionStatus = (value: string) => SUBMISSION_STATUSES.find((item) => item.value === value) || SUBMISSION_STATUSES[0]

export const CLOSED_REASONS = ['disabled', 'auth', 'permission', 'window', 'once', 'cooldown', 'limit'] as const

export type ClosedReason = (typeof CLOSED_REASONS)[number]

export const RESERVED_SLUGS = ['nav', 'my', 'manage']

export const GUEST_NAME = '__username'
export const GUEST_EMAIL = '__email'

export const FIELD_KEY_PATTERN = /^[a-z][a-z0-9_]{0,47}$/
export const FORM_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,47}$/

export const DEFAULT_MAX_SIZE_MB = 8
export const DEFAULT_RATING_STARS = 5
export const DEFAULT_TEXTAREA_ROWS = 4
export const UPLOADS_PER_HOUR = 10
export const ANSWER_TEXT_LIMIT = 4000
export const OPTION_LABEL_LIMIT = 120

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

export const latinize = (value: string): string =>
  String(value || '')
    .toLowerCase()
    .split('')
    .map((letter) => (letter in TRANSLIT ? TRANSLIT[letter] : letter))
    .join('')

export const toKey = (value: string): string =>
  latinize(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48) || 'field'

export const toSlug = (value: string): string =>
  latinize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)

export interface FieldOption {
  value: string
  label: string
}

export interface FieldSettings {
  min?: number
  max?: number
  step?: number
  min_length?: number
  max_length?: number
  pattern?: string
  rows?: number
  accept?: string
  max_size?: number
  stars?: number
}

export interface FieldCondition {
  field: string
  op: string
  value?: string
}

export interface FormFieldShape {
  key: string
  type: string
  label: string
  hint?: string | null
  placeholder?: string | null
  required: boolean
  half: boolean
  position: number
  options?: FieldOption[] | null
  settings?: FieldSettings | null
  visible_if?: FieldCondition | null
}

export type AnswerValue = string | number | boolean | string[] | null

export const isEmptyAnswer = (value: AnswerValue): boolean => {
  if (value === null || value === undefined) return true
  if (Array.isArray(value)) return !value.length
  if (typeof value === 'string') return !value.trim()
  if (typeof value === 'boolean') return !value

  return false
}

export const conditionMet = (condition: FieldCondition | null | undefined, answers: Record<string, AnswerValue>): boolean => {
  if (!condition || !condition.field) return true

  const value = answers[condition.field]
  const expected = condition.value ?? ''

  switch (condition.op) {
    case 'filled':
      return !isEmptyAnswer(value)
    case 'empty':
      return isEmptyAnswer(value)
    case 'ne':
      return String(value ?? '') !== expected
    case 'contains':
      return Array.isArray(value) ? value.map(String).includes(expected) : String(value ?? '').includes(expected)
    case 'gt':
      return Number(value) > Number(expected)
    case 'lt':
      return Number(value) < Number(expected)
    default:
      return String(value ?? '') === expected
  }
}

export const visibleFields = <T extends FormFieldShape>(fields: T[], answers: Record<string, AnswerValue>): T[] =>
  fields.filter((field) => conditionMet(field.visible_if, answers))

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const answerError = (field: FormFieldShape, value: AnswerValue): string | null => {
  const info = fieldType(field.type)

  if (!info.input) return null

  const settings = field.settings || {}
  const empty = isEmptyAnswer(value)

  if (field.required && empty) return 'mod.forms.error_required'
  if (empty) return null

  if (info.options) {
    const allowed = (field.options || []).map((option) => option.value)
    const picked = Array.isArray(value) ? value.map(String) : [String(value)]

    if (picked.some((item) => !allowed.includes(item))) return 'mod.forms.error_option'
  }

  if (info.multi) {
    const count = Array.isArray(value) ? value.length : 0

    if (settings.min && count < settings.min) return 'mod.forms.error_pick_min'
    if (settings.max && count > settings.max) return 'mod.forms.error_pick_max'
  }

  if (field.type === 'email' && !EMAIL_PATTERN.test(String(value))) return 'mod.forms.error_email'

  if (field.type === 'url' && !/^https?:\/\/\S+$/i.test(String(value))) return 'mod.forms.error_url'

  if (['text', 'textarea'].includes(field.type)) {
    const text = String(value)

    if (settings.min_length && text.length < settings.min_length) return 'mod.forms.error_min_length'
    if (settings.max_length && text.length > settings.max_length) return 'mod.forms.error_max_length'
    if (settings.pattern) {
      try {
        if (!new RegExp(settings.pattern).test(text)) return 'mod.forms.error_pattern'
      } catch {
        return null
      }
    }
  }

  if (['number', 'slider', 'rating'].includes(field.type)) {
    const number = Number(value)

    if (Number.isNaN(number)) return 'mod.forms.error_number'
    if (settings.min !== undefined && settings.min !== null && number < settings.min) return 'mod.forms.error_min'
    if (settings.max !== undefined && settings.max !== null && number > settings.max) return 'mod.forms.error_max'
  }

  return null
}

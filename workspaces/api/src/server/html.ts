import { Transform } from 'class-transformer'
import { core } from './core'
import { SanitizeNarrow } from './types'

export type { SanitizeNarrow }

export const sanitizeHtml = (html: string, narrow?: SanitizeNarrow): string => core().html.sanitize(html, narrow)

export const SanitizeHtml = (narrow?: SanitizeNarrow): PropertyDecorator =>
  Transform(({ value }) => (typeof value === 'string' ? sanitizeHtml(value, narrow) : value))

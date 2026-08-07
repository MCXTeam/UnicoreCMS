import { LOCALE_COOKIE } from 'unicore-common/locales'

export interface LocaleOption {
  code: string
  name: string
  is_default: boolean
}

export function useLocales() {
  return useState<LocaleOption[]>('locales', () => [])
}

export function useLocale() {
  return useState<string>('locale', () => 'ru')
}

export function useMessages() {
  return useState<Record<string, string>>('messages', () => ({}))
}

export function useDefaultLocale() {
  const locales = useLocales()

  return computed(() => locales.value.find((locale) => locale.is_default)?.code || 'ru')
}

export function useLocaleCookie() {
  return useCookie(LOCALE_COOKIE, { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
}

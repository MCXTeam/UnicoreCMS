import { useDefaultLocale, useLocale, useLocaleCookie, useLocales, useMessages } from '~/composables/useLocale'

export default defineNuxtPlugin(async (nuxtApp) => {
  const { $api } = nuxtApp as any
  const locales = useLocales()
  const locale = useLocale()
  const messages = useMessages()
  const cookie = useLocaleCookie()

  if (!locales.value.length) {
    locales.value = await $api
      .get('/locales')
      .then((res: any) => res.data)
      .catch(() => [])
  }

  const defaultLocale = useDefaultLocale()

  async function load(code: string) {
    locale.value = code
    messages.value = await $api
      .get(`/locales/${code}/messages`)
      .then((res: any) => res.data)
      .catch(() => ({}))
  }

  const current = locales.value.find((item) => item.code === cookie.value)?.code || defaultLocale.value

  if (current !== locale.value || !Object.keys(messages.value).length) await load(current)

  useHead({ htmlAttrs: { lang: locale } })

  function t(key: string, params?: Record<string, string | number>): string {
    const message = messages.value[key] ?? key

    if (!params) return message

    return Object.entries(params).reduce((result, [name, value]) => result.split(`{${name}}`).join(String(value)), message)
  }

  async function setLocale(code: string) {
    cookie.value = code
    await load(code)
  }

  return {
    provide: {
      t,
      setLocale,
    },
  }
})

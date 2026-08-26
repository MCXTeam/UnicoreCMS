import { UAParser } from 'ua-parser-js'
import { formatDuration, type DurationUnit } from 'unicore-common/duration'
import { ACTIVE_MODULES_KEY } from 'unicore-api'
import { setActiveModules } from 'unicore-api/admin'
import { useConfigStore } from '~/stores/config'
import { useLocale } from '~/composables/useLocale'

export default defineNuxtPlugin(async (nuxtApp) => {
  const parser = new UAParser()
  const rc = useRuntimeConfig()
  const configStore = useConfigStore()
  const locale = useLocale()

  const config = await configStore.fetch().catch(() => null)

  setActiveModules(config ? String(config[ACTIVE_MODULES_KEY] || '').split(',').filter(Boolean) : null)

  const utils = {
    formatCurrency(type: string, value: number, sale?: number) {
      const decimals = Number(rc.public[(type + 'Decimals') as keyof typeof rc.public]) || 0

      if (sale) value = value - (value / 100) * sale

      if (!decimals || decimals <= 0) value = Math.round(value)
      else value = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)

      const tag = locale.value === 'ru' ? 'ru-RU' : 'en-US'

      return value.toLocaleString(tag, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + (type == 'real' ? ' ₽' : '')
    },
    formatDuration(value: number, unit: DurationUnit = 'minutes') {
      return formatDuration(value, unit, locale.value)
    },
    notifyError(error: any, fallback: string): void {
      if (error?.response?.status === 403) return

      const message = error?.response?.data?.message
      const text = Array.isArray(message) ? message.join('. ') : message
      const detail = text && text !== error?.response?.data?.error ? text : fallback

      nuxtApp.vueApp.config.globalProperties.$toast?.add({ severity: 'error', detail, life: 3000 })
    },
    uaParse(value: string) {
      const res = parser.setUA(value).getResult()

      return {
        browser: `${res.browser.name} ${res.browser.version}`,
        os: `${res.os.name} ${res.os.version}`,
        raw: `${res.browser.name} ${res.browser.version}, ${res.os.name} ${res.os.version}`,
      }
    },
  }

  return { provide: { utils } }
})

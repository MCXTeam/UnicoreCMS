import { UAParser } from 'ua-parser-js'
import { formatDuration, type DurationUnit } from 'unicore-common/duration'
import { ACTIVE_MODULES_KEY } from 'unicore-api'
import { setActiveModules } from 'unicore-api/client'
import { useConfigStore } from '~/stores/config'
import { useLocale } from '~/composables/useLocale'

export default defineNuxtPlugin(async () => {
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
    uaParse(value: string) {
      const res = parser.setUA(value).getResult()
      const join = (...parts: (string | undefined)[]) =>
        parts.filter(Boolean).join(' ') || String((useNuxtApp() as any).$t?.('common.unknown') ?? 'common.unknown')
      const browser = join(res.browser.name, res.browser.version)
      const os = join(res.os.name, res.os.version)

      return {
        browser,
        os,
        raw: `${browser}, ${os}`,
      }
    },
  }

  return { provide: { utils } }
})

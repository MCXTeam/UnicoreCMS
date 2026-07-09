import { UAParser } from 'ua-parser-js'
import { useConfigStore } from '~/stores/config'

export default defineNuxtPlugin(async () => {
  const parser = new UAParser()
  const rc = useRuntimeConfig()
  const configStore = useConfigStore()

  await configStore.fetch().catch(() => {})

  const utils = {
    formatCurrency(type: string, value: number, sale?: number) {
      const decimals = Number(rc.public[(type + 'Decimals') as keyof typeof rc.public]) || 0

      if (sale) value = value - (value / 100) * sale

      if (!decimals || decimals <= 0) value = Math.round(value)
      else value = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)

      return (
        value.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + (type == 'real' ? ' ₽' : '')
      )
    },
    uaParse(value: string) {
      const res = parser.setUA(value).getResult()
      const join = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' ') || 'Неизвестно'
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

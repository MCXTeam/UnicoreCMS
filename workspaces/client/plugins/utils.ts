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

      return {
        browser: `${res.browser.name} ${res.browser.version}`,
        os: `${res.os.name} ${res.os.version}`,
        raw: `${res.browser.name} ${res.browser.version}, ${res.os.name} ${res.os.version}`,
      }
    },
  }

  return { provide: { utils } }
})

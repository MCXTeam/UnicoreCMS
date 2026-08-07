import { usePrimeVue } from 'primevue/config'
import { PRIMEVUE_ARIA_KEYS, PRIMEVUE_LOCALE_KEYS } from 'unicore-common/locales'
import { useLocale } from '~/composables/useLocale'

export default defineNuxtPlugin((nuxtApp) => {
  const primevue = usePrimeVue()
  const locale = useLocale()
  const { $t, $moment } = nuxtApp as any

  watchEffect(() => {
    const data = $moment.localeData(locale.value === 'ru' ? 'ru' : 'en')
    const config = primevue.config.locale as any

    Object.assign(config, {
      dayNames: data.weekdays(),
      dayNamesShort: data.weekdaysShort(),
      dayNamesMin: data.weekdaysMin(),
      monthNames: data.months(),
      monthNamesShort: data.monthsShort(),
      firstDayOfWeek: data.firstDayOfWeek(),
      ...Object.fromEntries(PRIMEVUE_LOCALE_KEYS.map((key) => [key, $t(`pv.${key}`)])),
    })

    Object.assign(config.aria, Object.fromEntries(PRIMEVUE_ARIA_KEYS.map((key) => [key, $t(`pv.${key}`)])))
  })
})

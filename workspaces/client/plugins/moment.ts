import moment from 'moment-timezone'
import 'moment/locale/ru'
import momentDurationFormatSetup from 'moment-duration-format'
import { extendMoment } from 'moment-range'
import { useLocale } from '~/composables/useLocale'

export default defineNuxtPlugin(() => {
  const { timezone } = useRuntimeConfig().public
  const locale = useLocale()

  moment.defaultFormat = 'DD.MM.YYYY'
  momentDurationFormatSetup(moment as any)
  extendMoment(moment as any)
  moment.tz.setDefault(timezone as string)

  watchEffect(() => moment.locale(locale.value === 'ru' ? 'ru' : 'en'))

  return { provide: { moment } }
})

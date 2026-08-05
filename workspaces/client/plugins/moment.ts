import moment from 'moment-timezone'
import 'moment/locale/ru'
import momentDurationFormatSetup from 'moment-duration-format'
import momentRange from 'moment-range'

export default defineNuxtPlugin(() => {
  const { timezone } = useRuntimeConfig().public

  moment.defaultFormat = 'DD.MM.YYYY'
  momentDurationFormatSetup(moment as any)
  momentRange.extendMoment(moment as any)
  moment.locale('ru')
  moment.tz.setDefault(timezone as string)

  return { provide: { moment } }
})

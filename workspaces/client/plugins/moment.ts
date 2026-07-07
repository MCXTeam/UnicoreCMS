import moment from 'moment'
import 'moment/locale/ru'
import momentDurationFormatSetup from 'moment-duration-format'
import momentRange from 'moment-range'

export default defineNuxtPlugin(() => {
  moment.defaultFormat = 'DD.MM.YYYY'
  momentDurationFormatSetup(moment as any)
  momentRange.extendMoment(moment as any)
  moment.locale('ru')

  return { provide: { moment } }
})

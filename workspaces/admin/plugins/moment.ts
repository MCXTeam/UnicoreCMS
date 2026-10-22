import moment from 'moment-timezone'
import 'moment/locale/ru'
import momentDurationFormatSetup from 'moment-duration-format'
import * as momentRange from 'moment-range'
import { useLocale } from '~/composables/useLocale'
import { useUserTimezone } from '../../ui/composables/useUserTimezone'
import { userDateFactory } from '../../ui/utils/userDate'

const { extendMoment } = (momentRange as any).default ?? momentRange

export default defineNuxtPlugin(() => {
  const timezone = useUserTimezone()
  const locale = useLocale()

  moment.defaultFormat = 'DD.MM.YYYY'
  momentDurationFormatSetup(moment as any)
  extendMoment(moment as any)

  watchEffect(() => moment.locale(locale.value === 'ru' ? 'ru' : 'en'))

  return { provide: { moment: userDateFactory(moment, () => timezone.value) } }
})

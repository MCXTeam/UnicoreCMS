import { Plugin } from '@nuxt/types'
import momentDurationFormatSetup from 'moment-duration-format'
import { extendMoment } from 'moment-range'

// @ts-ignore
const MomentPlugin: Plugin = ({ $moment, $axios }) => {
  $moment.defaultFormat = 'DD.MM.YYYY'
  momentDurationFormatSetup($moment as any)
  extendMoment($moment as any)

  $moment.locale('ru')

  $axios.onRequest(async (config) => {
    // @ts-ignore
    config.headers.common['Timezone'] = $moment.tz.guess()
    await new Promise((resolve) => setTimeout(resolve, 500))
    return config
  })
}

export default MomentPlugin

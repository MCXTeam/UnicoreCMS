import { Plugin } from '@nuxt/types'
// @ts-ignore
import AOS from 'aos'
import 'aos/dist/aos.css'

const AosPlugin: Plugin = ({ app }) => {
  app.AOS = new AOS.init({
    disable: 'phone',
    once: true,
  })
}

export default AosPlugin

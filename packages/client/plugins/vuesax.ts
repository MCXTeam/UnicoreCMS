import Vue from 'vue'
import { Plugin } from '@nuxt/types'
// @ts-ignore
import Vuesax from 'vuesax'

import 'boxicons/css/boxicons.min.css'

Vue.use(Vuesax)

const unicorePlugin: Plugin = (context, inject) => {
  inject('vs', Vue.prototype.$vs)
}

export default unicorePlugin

import { Plugin } from '@nuxt/types'
import { UAParser } from 'ua-parser-js'

interface utils {
  formatCurrency(type: string, value: number, sale: number): string
  uaParse(value: string): string
}

declare module 'vue/types/vue' {
  interface Vue {
    $utils: utils
  }
}

declare module '@nuxt/types' {
  interface NuxtAppOptions {
    $utils: utils
  }
  interface Context {
    $utils: utils
  }
}

declare module 'vuex/types/index' {
  interface Store<S> {
    $utils: utils
  }
}

const utilsPlugin: Plugin = async (context, inject) => {
  const parser = new UAParser()

  // FETCH STORE RESOURCES
  const cfg = await context.$axios.get('/config/public').then((res) => res.data)
  context.store.commit('SET_CONFIG', cfg)
  //

  inject('utils', {
    formatCurrency(type: string, value: number, sale: number) {
      var decimals = context.$config[type + "Decimals"]

      if (sale) value = value - value / 100 * sale

      if (!decimals || decimals <= 0)
        value = Math.round(value)
      else
        value = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)

      return value.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + (type == "real" ? " ₽" : "")
    },

    uaParse(value: string) {
      const res = parser.setUA(value).getResult()

      return {
        browser: `${res.browser.name} ${res.browser.version}`,
        os: `${res.os.name} ${res.os.version}`,
        raw: `${res.browser.name} ${res.browser.version}, ${res.os.name} ${res.os.version}`
      }
    },
  })
}

export default utilsPlugin

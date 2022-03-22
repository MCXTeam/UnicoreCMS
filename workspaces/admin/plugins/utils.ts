import { Plugin } from '@nuxt/types'

interface utils {
  formatCurrency(value: number): string
  formatNumber(value: number): string
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

const utilsPlugin: Plugin = (context, inject) => {
  inject('utils', {
    formatCurrency(value: number, sale: number) {
      if (!value) value = 0

      if (sale) value = value - (value * sale) / 100

      return value.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })
    },
    formatNumber(value: number) {
      if (!value) value = 0
      return value.toLocaleString('ru-RU', { minimumFractionDigits: 2 })
    },
  })
}

export default utilsPlugin

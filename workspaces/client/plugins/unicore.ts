import { Plugin, Context } from '@nuxt/types'
import { AxiosError } from 'axios'
import SkinView2D from '../../admin/components/SkinView2D.vue'
import SkinView3D from '../../admin/components/SkinView3D.vue'
import Vue from 'vue'

Vue.component('SkinView2D', SkinView2D)
Vue.component('SkinView3D', SkinView3D)

class UnicorePlugin {
  private context: Context

  constructor(context: Context) {
    this.context = context
  }

  async logout() {
    const loading = this.context.$vs.loading({
      text: 'Выход из системы...',
    })
    await this.context.$auth.logout()
    loading.close()
  }

  authErrorNotification(res: AxiosError, text: string) {
    const config = {
      icon: `<i class='bx bxs-bug' ></i>`,
      color: 'danger',
      position: 'top-right',
      title: 'Ошибка авторизации!',
    }

    if (res.response?.status == 429) {
      this.context.$vs.notification({
        ...config,
        text: `Слишком много запросов, подождите пару минут...`,
      })
    } else {
      this.context.$vs.notification({ ...config, text })
    }
  }

  successNotification(text: string) {
    const config = {
      icon: `<i class='bx bx-select-multiple' ></i>`,
      color: 'success',
      position: 'top-right',
      title: 'Успех!',
    }

    this.context.$vs.notification({ ...config, text })
  }

  errorNotification(text: string) {
    const config = {
      icon: `<i class='bx bxs-bug' ></i>`,
      color: 'danger',
      position: 'top-right',
      title: 'Ошибка!',
    }

    this.context.$vs.notification({ ...config, text })
  }

  switchTheme() {
    if (this.context.$colorMode.preference == 'light') this.context.$colorMode.preference = 'dark'
    else this.context.$colorMode.preference = 'light'
  }
}

declare module '@nuxt/types' {
  interface Context {
    $unicore: UnicorePlugin
    $auth: any
    $vs: any
  }
}

const unicorePlugin: Plugin = async (context, inject) => {
  inject('unicore', new UnicorePlugin(context))
}

export default unicorePlugin

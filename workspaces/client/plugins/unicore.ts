import { useAuthStore } from '~/stores/auth'
import { useUiStore } from '~/stores/ui'

interface ToastLike {
  add: (message: Record<string, unknown>) => void
}

export interface LoadingHandle {
  close: () => void
}

export interface UnicoreApi {
  loading: (text?: string) => LoadingHandle
  logout: () => Promise<void>
  authErrorNotification: (error: any, text: string) => void
  successNotification: (text: string) => void
  errorNotification: (text: string) => void
  switchTheme: () => void
}

export default defineNuxtPlugin((nuxtApp) => {
  const colorMode = useColorMode()

  const toast = (): ToastLike | undefined => nuxtApp.vueApp.config.globalProperties.$toast as ToastLike | undefined

  const notify = (severity: string, summary: string, detail: string) => toast()?.add({ severity, summary, detail, life: 4000 })

  const unicore: UnicoreApi = {
    loading(text = 'Загрузка...') {
      const ui = useUiStore()
      ui.startLoading(text)
      let closed = false
      return {
        close() {
          if (closed) return
          closed = true
          ui.stopLoading()
        },
      }
    },
    async logout() {
      const auth = useAuthStore()
      const handle = this.loading('Выход из системы...')
      try {
        await auth.logout()
      } finally {
        handle.close()
      }
      await navigateTo('/')
    },
    authErrorNotification(error: any, text: string) {
      if (error?.response?.status === 429) notify('error', 'Ошибка авторизации!', 'Слишком много запросов, подождите пару минут...')
      else notify('error', 'Ошибка авторизации!', text)
    },
    successNotification(text: string) {
      notify('success', 'Успех!', text)
    },
    errorNotification(text: string) {
      notify('error', 'Ошибка!', text)
    },
    switchTheme() {
      colorMode.preference = colorMode.value === 'light' ? 'dark' : 'light'
    },
  }

  return { provide: { unicore } }
})

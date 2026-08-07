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

  const t = (key: string) => String((nuxtApp as any).$t?.(key) ?? key)

  const toast = (): ToastLike | undefined => nuxtApp.vueApp.config.globalProperties.$toast as ToastLike | undefined

  const notify = (severity: string, summary: string, detail: string) => toast()?.add({ severity, summary, detail, life: 4000 })

  const unicore: UnicoreApi = {
    loading(text?: string) {
      const ui = useUiStore()
      ui.startLoading(text ?? t('common.loading'))
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
      const handle = this.loading(t('common.logging_out'))
      try {
        await auth.logout()
      } finally {
        handle.close()
      }
      await navigateTo('/')
    },
    authErrorNotification(error: any, text: string) {
      if (error?.response?.status === 429) notify('error', t('error.auth_title'), t('error.too_many_requests'))
      else notify('error', t('error.auth_title'), text)
    },
    successNotification(text: string) {
      notify('success', t('common.success'), text)
    },
    errorNotification(text: string) {
      notify('error', t('error.title'), text)
    },
    switchTheme() {
      colorMode.preference = colorMode.value === 'light' ? 'dark' : 'light'
    },
  }

  return { provide: { unicore } }
})

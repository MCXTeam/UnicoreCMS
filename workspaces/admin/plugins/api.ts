import axios, { type AxiosInstance } from 'axios'
import { RAW_CONTENT_HEADER } from 'unicore-common/locales'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const api: AxiosInstance = axios.create({ baseURL: config.public.apiBaseurl })

  api.interceptors.request.use((cfg) => {
    const auth = useAuthStore()
    if (auth.accessToken) cfg.headers.Authorization = `Bearer ${auth.accessToken}`
    cfg.headers['Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone
    cfg.headers[RAW_CONTENT_HEADER] = '1'
    return cfg
  })

  let refreshing: Promise<string> | null = null

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const auth = useAuthStore()
      const status = error.response?.status
      const original = error.config

      if (status === 401 && auth.refreshToken && original && !original._retry) {
        original._retry = true
        try {
          if (!refreshing)
            refreshing = auth.refresh().finally(() => {
              refreshing = null
            })
          const token = await refreshing
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        } catch {
          await auth.logout()
          await navigateTo('/login')
        }
      }

      if (status === 403 && import.meta.client && !original?.silent) {
        const toast = nuxtApp.vueApp.config.globalProperties.$toast
        const t = (key: string) => String((nuxtApp as any).$t?.(key) ?? key)

        toast?.add({ severity: 'error', summary: t('error.title'), detail: t('error.no_permission'), life: 4000 })
      }

      return Promise.reject(error)
    },
  )

  return { provide: { api } }
})

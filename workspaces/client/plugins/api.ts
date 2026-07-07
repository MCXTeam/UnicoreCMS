import axios, { type AxiosInstance } from 'axios'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const api: AxiosInstance = axios.create({ baseURL: config.public.apiBaseurl })

  api.interceptors.request.use((cfg) => {
    const auth = useAuthStore()
    if (auth.accessToken) cfg.headers.Authorization = `Bearer ${auth.accessToken}`
    cfg.headers['Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone
    return cfg
  })

  let refreshing: Promise<string> | null = null

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const auth = useAuthStore()
      const status = error.response?.status
      const original = error.config

      const isAuthEndpoint = /\/auth\/(refresh|logout)/.test(original?.url || '')

      if (status === 401 && auth.refreshToken && original && !original._retry && !isAuthEndpoint) {
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
          auth.setUser(null)
          auth.setTokens(null, null)
          await navigateTo('/auth')
        }
      }

      if (status === 403 && import.meta.client) {
        const toast = nuxtApp.vueApp.config.globalProperties.$toast
        toast?.add({ severity: 'error', summary: 'Ошибка!', detail: 'Недостаточно прав для выполнения данного действия', life: 4000 })
      }

      return Promise.reject(error)
    },
  )

  return { provide: { api } }
})

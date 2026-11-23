import { useAuthStore } from '~/stores/auth'
import { useConfigStore } from '~/stores/config'

export default defineNuxtPlugin(() => {
  const rc = useRuntimeConfig()
  const config = useConfigStore()
  const pub = reactive({
    ...rc.public,
    get sitename() {
      return String(config.config.public_project_name || rc.public.sitename)
    },
    get projectLogo() {
      return String(config.config.public_project_logo || '/icon.png')
    },
  })

  return {
    provide: {
      pub,
      auth: useAuthStore(),
    },
  }
})

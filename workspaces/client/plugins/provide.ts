import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  const rc = useRuntimeConfig()

  return {
    provide: {
      pub: rc.public,
      auth: useAuthStore(),
    },
  }
})

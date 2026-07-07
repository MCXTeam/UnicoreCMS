import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  auth.loadTokens()

  if (auth.accessToken) {
    await auth.fetchUser().catch(() => auth.setUser(null))
  }
})

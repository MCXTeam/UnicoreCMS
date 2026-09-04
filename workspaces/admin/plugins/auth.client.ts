import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()

  auth.loadTokens()

  await auth.syncCsrf()

  if (!auth.hasSession) return

  try {
    await auth.refresh()
    await auth.fetchUser()
  } catch {
    auth.setUser(null)
    auth.setTokens(null, null)
  }
})

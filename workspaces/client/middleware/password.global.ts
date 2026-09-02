import { useAuthStore } from '~/stores/auth'

const SETTINGS_PAGE = '/cabinet/settings'
const AUTH_PREFIX = '/auth'

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  if (!auth.loggedIn || !auth.user?.password_change_required) return
  if (to.path === SETTINGS_PAGE || to.path.startsWith(AUTH_PREFIX)) return

  return navigateTo(SETTINGS_PAGE)
})

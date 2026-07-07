import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  if (auth.loggedIn && !auth.user?.activated && to.path !== '/auth/verify') {
    return navigateTo('/auth/verify')
  }
})

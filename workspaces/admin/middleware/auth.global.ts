import { useAuthStore } from '~/stores/auth'

const publicPages = ['/login']

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  if (publicPages.includes(to.path)) {
    if (auth.loggedIn && auth.isAdmin) return navigateTo('/')
    return
  }

  if (!auth.loggedIn || !auth.isAdmin) {
    return navigateTo('/login')
  }
})

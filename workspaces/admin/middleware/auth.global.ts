import { useAuthStore } from '~/stores/auth'
import { routeAccess } from '~/constants/access'

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

  if (to.path !== '/' && !auth.can(routeAccess(to.path))) {
    return navigateTo('/')
  }
})

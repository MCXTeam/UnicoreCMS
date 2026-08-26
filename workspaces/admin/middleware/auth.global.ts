import { moduleActive } from 'unicore-api/admin'
import { useAuthStore } from '~/stores/auth'
import { routeAccess } from '~/constants/access'

const publicPages = ['/login']
const MODULE_PATH = /^\/mod\/([a-z][a-z0-9_]{2,31})(?:\/|$)/

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

  const module = MODULE_PATH.exec(to.path)

  if (module && !moduleActive(module[1])) {
    return navigateTo('/')
  }
})

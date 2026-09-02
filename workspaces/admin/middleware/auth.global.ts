import { moduleActive } from 'unicore-api/admin'
import { useAuthStore } from '~/stores/auth'
import { routeAccess } from '~/constants/access'

const publicPages = ['/login']
const PASSWORD_PAGE = '/password'
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

  if (auth.user?.password_change_required) {
    return to.path === PASSWORD_PAGE ? undefined : navigateTo(PASSWORD_PAGE)
  }

  if (to.path === PASSWORD_PAGE) return navigateTo('/')

  if (to.path !== '/' && !auth.can(routeAccess(to.path))) {
    return navigateTo('/')
  }

  const module = MODULE_PATH.exec(to.path)

  if (module && !moduleActive(module[1])) {
    return navigateTo('/')
  }
})

import { Middleware } from '@nuxt/types'

const adminMiddleware: Middleware = ({ $auth }) => {
  if (!$auth.user) return $auth.redirect("login")
  if ($auth.user?.perms && !($auth.user?.perms as string[]).find(perm => perm == "admin.dashboard"))
    return $auth.redirect("login")
}

export default adminMiddleware

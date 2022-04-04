import { Middleware } from '@nuxt/types'

const adminMiddleware: Middleware = ({ $auth, redirect, $config }) => {
  if ($auth.user?.perms && !($auth.user?.perms as string[]).find(perm => perm == "admin.dashboard")) return redirect($config.url)
}

export default adminMiddleware

import { Middleware } from '@nuxt/types'

const verifyMiddleware: Middleware = ({ $auth }: any) => {
  if ($auth?.loggedIn) return $auth.redirect('home')
}

export default verifyMiddleware

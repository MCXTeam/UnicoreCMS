import { Middleware } from '@nuxt/types';

const verifyMiddleware: Middleware = ({ $auth, redirect, route }) => {
  if (!$auth.user?.activated)
    return redirect('/auth/verify');
  else if (route.path?.startsWith('/auth'))
    return $auth.redirect('home');;
};

export default verifyMiddleware;
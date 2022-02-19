import { Middleware } from '@nuxt/types';

const verifyMiddleware: Middleware = ({ $auth, redirect }: any) => {
  if (!$auth?.user?.activated)
    return redirect('/auth/verify');
  else
    return $auth.redirect('home');;
};

export default verifyMiddleware;
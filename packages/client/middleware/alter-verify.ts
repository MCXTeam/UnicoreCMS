import { Middleware } from '@nuxt/types';

const alterVerifyMiddleware: Middleware = ({ $auth }: any) => {
  if ($auth?.user?.activated)
    return $auth.redirect('home');;
};

export default alterVerifyMiddleware;
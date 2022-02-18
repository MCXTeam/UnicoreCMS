import { Plugin } from '@nuxt/types';
// @ts-ignore
import NProgress from 'nprogress'

const NprogressPlugin: Plugin = ({ app }) => {
  app.router?.beforeEach((to, from, next) => {
    NProgress.start();
    next()
  });

  app.router?.afterEach(() => {
    NProgress.done()
  });
}

export default NprogressPlugin
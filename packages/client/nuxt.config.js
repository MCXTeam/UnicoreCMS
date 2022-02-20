import PurgecssPlugin from 'purgecss-webpack-plugin'
import glob from 'glob-all'
import path from 'path'
import mainConfig from 'unicore-admin/main.config'
import { envConfig } from 'unicore-common/dist/envconfig'

export default mainConfig({
  loading: false,

  head: {
    titleTemplate: `%s - ${envConfig.name}`,
    title: 'Игровые серверы Minecraft'
  },

  auth: {
    redirect: {
      login: '/auth',
      logout: '/',
      home: '/cabinet'
    },
  },

  css: [
    'normalize.css/normalize.css',
    'vuesax/dist/vuesax.css',
    'flag-icons/sass/flag-icons.scss',
    '~assets/style/main.scss',
    '~assets/fonts/main.scss',
  ],

  buildModules: ['@nuxtjs/color-mode'],

  plugins: [
    { src: '~/plugins/vuesax.ts' },
    { src: '~/plugins/aos.ts', ssr: false },
    { src: '~/plugins/number-animation.ts', ssr: false },
    { src: '~/plugins/primevue.ts' },
    { src: '~/plugins/unicore.ts', ssr: false },
    { src: '~/plugins/nprogress.ts', ssr: false },
  ],

  serverMiddleware: ['~/server-middleware/ssr-handler.ts'],

  router: {
    extendRoutes(routes, resolve) {
      routes.push(
        {
          name: 'page/index',
          path: '/page/**',
          component: resolve(__dirname, 'pages/page/index.vue'),
        }
      )
    }
  },

  build: {
    extractCSS: true,
    transpile: ['primevue'],
    extend(config, { isDev, isClient }) {
      if (!isDev) {
        config.plugins.push(
          new PurgecssPlugin({
            safelist: [
              'aos-init',
              'aos-animate',
              'data-aos-delay',
              'data-aos-duration',
              'fade-up',
              'fade-left',
              'fade-right',
              'flip-left',
              'dark-mode',
              /^vs-/,
              /-(leave|enter|appear)(|-(to|from|active))$/,
              /^(?!(|.*?:)cursor-move).+-move$/,
              /^router-link(|-exact)-active$/,
            ],
            paths: glob.sync([
              path.join(__dirname, './pages/**/*.vue'),
              path.join(__dirname, './layouts/**/*.vue'),
              path.join(__dirname, './components/**/*.vue'),
              path.join(__dirname, './plugins/**/*.ts'),
              path.join(__dirname, '../../node_modules/primevue/**/*.@(vue|js)'),
              path.join(__dirname, '../../node_modules/vuesax/**/*.@(vue|js)'),
            ]),
            whitelist: ['html', 'body'],
          })
        )
      }
    },
  },
})

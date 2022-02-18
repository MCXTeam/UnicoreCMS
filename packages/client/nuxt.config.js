import PurgecssPlugin from 'purgecss-webpack-plugin'
import glob from 'glob-all'
import path from 'path'
import mainConfig from 'unicore-admin/main.config'

export default mainConfig({
  loading: false,

  css: [
    'normalize.css/normalize.css',
    'vuesax/dist/vuesax.css',
    'flag-icons/sass/flag-icons.scss',
    '~assets/style/main.scss',
    '~assets/fonts/main.scss',
  ],

  buildModules: [
    '@nuxtjs/color-mode'
  ],

  plugins: [
    { src: '~/plugins/vuesax.ts' },
    { src: '~/plugins/aos.ts', ssr: false },
    { src: '~/plugins/number-animation.ts', ssr: false },
    { src: '~/plugins/primevue.ts' },
    { src: '~/plugins/nprogress.ts', ssr: false }
  ],

  serverMiddleware: ['~/server-middlewares/ssr-handler.ts'],

  build: {
    extractCSS: true,
    transpile: ['primevue'],
    extend(config, { isDev, isClient }) {
      if (!isDev) {
        config.plugins.push(
          new PurgecssPlugin({
            safelist: [
              "aos-init",
              "aos-animate",
              "data-aos-delay",
              "data-aos-duration",
              "fade-up",
              "fade-left",
              "fade-right",
              "flip-left",
              "dark-mode",
              /^vs-/,
              /-(leave|enter|appear)(|-(to|from|active))$/,
              /^(?!(|.*?:)cursor-move).+-move$/,
              /^router-link(|-exact)-active$/
            ],
            paths: glob.sync([
              path.join(__dirname, './pages/**/*.vue'),
              path.join(__dirname, './layouts/**/*.vue'),
              path.join(__dirname, './components/**/*.vue'),
              path.join(__dirname, './plugins/**/*.ts'),
              path.join(__dirname, '../../node_modules/primevue/**/*.@(vue|js)'),
              path.join(__dirname, '../../node_modules/vuesax/**/*.@(vue|js)')
            ]),
            whitelist: ['html', 'body']
          })
        )
      }
    },
  },
})

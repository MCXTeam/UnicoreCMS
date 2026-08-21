import './load-env'
import { publicConfig } from 'unicore-common/public-config'
import { projectRoot } from 'unicore-common/ports'
import { resolveLayers } from 'unicore-api/nuxt'
import { SITEMAP_EXCLUDE } from './constants'
import { preset } from './theme/preset'

const layers = resolveLayers({ side: 'client', root: projectRoot })

for (const problem of layers.problems) console.warn(`[unicore] ${problem}`)

export default defineNuxtConfig({
  extends: [...layers.theme, ...layers.modules],

  ssr: true,

  devServer: {
    port: publicConfig.frontendPort,
    host: '0.0.0.0',
  },

  modules: [
    '~/modules/unicore-guard',
    '@primevue/nuxt-module',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@vueuse/motion/nuxt',
    '@nuxtjs/color-mode',
    '@nuxtjs/sitemap',
    'nuxt-gtag',
  ],

  gtag: {
    id: publicConfig.googleAnalyticsId,
    enabled: Boolean(publicConfig.googleAnalyticsId),
  },

  css: [
    'primeicons/primeicons.css',
    'primeflex/primeflex.css',
    'boxicons/css/boxicons.min.css',
    'normalize.css/normalize.css',
    'flag-icons/sass/flag-icons.scss',
    '~/assets/style/main.scss',
    '~/assets/fonts/main.scss',
  ],

  colorMode: {
    preference: publicConfig.colorModePreference,
    fallback: publicConfig.colorModeFallback,
    classSuffix: '',
  },

  app: {
    head: {
      title: 'Игровые серверы Minecraft',
      htmlAttrs: { lang: 'ru' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  runtimeConfig: {
    public: {
      apiBaseurl: publicConfig.apiBaseurl,
      baseurl: publicConfig.baseurl,
      sitename: publicConfig.sitename,
      timezone: publicConfig.timezone,
      yandexMetrikaId: publicConfig.yandexMetrikaId,
      recaptchaPublic: publicConfig.recaptchaPublic,
      realDecimals: publicConfig.realDecimals,
      virtualDecimals: publicConfig.virtualDecimals,
      ingameDecimals: publicConfig.ingameDecimals,
    },
  },

  routeRules: {
    '/auth/**': { ssr: false },
    '/cabinet/**': { ssr: false },
    '/store/**': { ssr: false },
    '/players/**': { ssr: false },
    '/store': { redirect: '/store/products' },
    '/players': { redirect: '/players/votes' },
  },

  site: { url: publicConfig.baseurl },

  sitemap: {
    exclude: SITEMAP_EXCLUDE,
    sources: ['/api/__sitemap__/urls'],
    defaults: { changefreq: 'daily', priority: 0.8 },
  },

  primevue: {
    autoImport: true,
    options: {
      ripple: true,
      theme: {
        preset,
        options: {
          darkModeSelector: '.dark',
          cssLayer: false,
        },
      },
    },
  },

  typescript: {
    shim: false,
    tsConfig: {
      exclude: ['./dist'],
    },
  },

  vite: {
    resolve: {
      alias: [
        { find: /^moment-timezone$/, replacement: 'moment-timezone/builds/moment-timezone-with-data-10-year-range' },
        { find: /^moment$/, replacement: 'moment/moment.js' },
      ],
    },
  },

  compatibilityDate: '2025-01-01',
})

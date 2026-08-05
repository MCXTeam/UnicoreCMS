import './load-env'
import { publicConfig } from 'unicore-common/public-config'
import Aura from '@primevue/themes/aura'

const modules: (string | [string, Record<string, unknown>])[] = [
  '@primevue/nuxt-module',
  '@pinia/nuxt',
  '@vueuse/nuxt',
  '@vueuse/motion/nuxt',
  '@nuxtjs/color-mode',
  '@nuxtjs/sitemap',
]

if (publicConfig.googleAnalyticsId) modules.push(['nuxt-gtag', { id: publicConfig.googleAnalyticsId }])
if (publicConfig.yandexMetrikaId) modules.push(['yandex-metrika-module-nuxt3', { id: publicConfig.yandexMetrikaId }])

export default defineNuxtConfig({
  ssr: true,

  devServer: {
    port: publicConfig.frontendPort,
    host: '0.0.0.0',
  },

  modules,

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
      titleTemplate: `%s - ${publicConfig.sitename}`,
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
    exclude: ['/auth/**', '/cabinet/**', '/store/**', '/players/**', '/page'],
    sources: ['/api/__sitemap__/urls'],
    defaults: { changefreq: 'daily', priority: 0.8 },
  },

  primevue: {
    autoImport: true,
    options: {
      ripple: true,
      theme: {
        preset: Aura,
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
      alias: {
        'moment-timezone': 'moment-timezone/builds/moment-timezone-with-data-10-year-range',
      },
    },
  },

  compatibilityDate: '2025-01-01',
})

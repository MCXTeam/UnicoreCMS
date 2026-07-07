import './load-env'
import { publicConfig } from 'unicore-common/public-config'
import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
  ssr: false,

  devServer: {
    port: publicConfig.adminPort,
    host: '0.0.0.0',
  },

  modules: ['@primevue/nuxt-module', '@pinia/nuxt', '@vueuse/nuxt'],

  css: ['primeicons/primeicons.css', 'primeflex/primeflex.css', '~/assets/fonts/main.scss', '~/assets/styles/layout.scss'],

  app: {
    head: {
      titleTemplate: '%s - UnicoreCMS',
      title: 'Панель управления',
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
      recaptchaPublic: publicConfig.recaptchaPublic,
      jwtExpires: publicConfig.jwtExpires,
      jwtRefreshExpires: publicConfig.jwtRefreshExpires,
      realDecimals: publicConfig.realDecimals,
      virtualDecimals: publicConfig.virtualDecimals,
      ingameDecimals: publicConfig.ingameDecimals,
    },
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
  },

  compatibilityDate: '2025-01-01',
})

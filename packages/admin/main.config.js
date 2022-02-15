import merge from 'deepmerge'
import { envConfig } from 'unicore-common/dist/envconfig'
import ms from 'ms'

export default (config) =>
  merge(
    {
      // Глобальные заголовки страниц: https://go.nuxtjs.dev/config-head
      head: {
        title: 'UnicoreCMS',
        htmlAttrs: {
          lang: 'ru',
        },
        meta: [
          { charset: 'utf-8' },
          { name: 'viewport', content: 'width=device-width, initial-scale=1' },
          { hid: 'description', name: 'description', content: '' },
          { name: 'format-detection', content: 'telephone=no' },
        ],
        link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
      },

      server: {
        port: envConfig.frontendPort,
      },

      // Глобальный CSS: https://go.nuxtjs.dev/config-css
      css: [],

      // Плагины для запуска перед рендерингом страницы: https://go.nuxtjs.dev/config-plugins
      plugins: [
        { src: '../admin/plugins/vee-validate.ts', mode: 'client' },
        { src: '../admin/plugins/lodash.ts' },
        { src: '../admin/plugins/moment.ts' },
      ],

      // Автоматический импорт компонентов: https://go.nuxtjs.dev/config-components
      components: true,

      // Модули для разработки и сборки (рекомендуется): https://go.nuxtjs.dev/config-modules
      buildModules: [
        // https://go.nuxtjs.dev/typescript
        '@nuxt/postcss8',
        '@nuxtjs/moment',
        '@nuxt/typescript-build',
      ],

      // Модули: https://go.nuxtjs.dev/config-modules
      modules: ['@nuxtjs/axios', '@nuxtjs/auth-next', '@nuxtjs/recaptcha', 'nuxt-socket-io'],

      axios: {
        baseURL: envConfig.apiBaseurl,
      },

      io: {
        sockets: [
          {
            url: envConfig.apiBaseurl,
            vuex: {
              actions: ['servers/online --> io/serversOnline'],
            },
          },
        ],
      },

      recaptcha: {
        siteKey: envConfig.recaptchaPublic,
        version: 3,
      },

      auth: {
        strategies: {
          local: {
            scheme: 'unicore-admin/schemes/core',
            token: {
              property: 'accessToken',
              maxAge: ms(envConfig.jwtExpires) / 1000,
              global: true,
            },
            refreshToken: {
              property: 'refreshToken',
              data: 'refresh_token',
              maxAge: ms(envConfig.jwtRefreshExpires) / 1000,
            },
            user: {
              property: false,
            },
            endpoints: {
              login: { url: '/auth/login', method: 'post' },
              refresh: { url: '/auth/refresh', method: 'post' },
              user: { url: '/auth/me', method: 'get' },
              logout: { url: '/auth/logout', method: 'post' },
            },
          },
        },
      },

      moment: {
        /* module options */
        defaultLocale: 'ru',
        locales: ['ru'],
        defaultTimezone: 'Europe/Moscow',
        timezone: true,
      },

      publicRuntimeConfig: {
        apiUrl: envConfig.apiBaseurl,
      },

      // Конфигурация сборки: https://go.nuxtjs.dev/config-build
      build: {
        postcss: {
          plugins: {
            autoprefixer: {},
          },
        },
      },
    },
    config
  )

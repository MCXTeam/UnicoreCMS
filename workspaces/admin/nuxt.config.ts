import './load-env'
import { publicConfig } from 'unicore-common/public-config'
import { projectRoot } from 'unicore-common/ports'
import { CHUNK_SIZE_WARNING_LIMIT, vendorChunks, woff2Only } from 'unicore-common/vite'
import { FRONTEND_TEMPLATE_ROOTS, usedPrimevueComponents } from 'unicore-common/primevue'
import { components as primevueComponents } from '@primevue/metadata'
import { createRequire } from 'module'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { resolveLayers } from 'unicore-api/nuxt'
import { presetFor } from './theme/preset'

const layers = resolveLayers({ side: 'admin', root: projectRoot })

for (const problem of layers.problems) console.warn(`[unicore] ${problem}`)

const templateRoots = FRONTEND_TEMPLATE_ROOTS.map((entry) => resolve(dirname(fileURLToPath(import.meta.url)), entry))
const primevueRoot = resolve(dirname(createRequire(import.meta.url).resolve('primevue/config')), '..')

const primevueInUse = usedPrimevueComponents({
  roots: [...templateRoots, ...layers.theme, ...layers.modules],
  components: primevueComponents,
  primevueRoot,
})

export default defineNuxtConfig({
  extends: [...layers.theme, ...layers.modules],

  ssr: false,

  devServer: {
    port: publicConfig.adminPort,
    host: '0.0.0.0',
  },

  modules: ['~/modules/unicore-guard', '@primevue/nuxt-module', '@pinia/nuxt', '@vueuse/nuxt', '@nuxtjs/color-mode'],

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'unicore-admin-color-mode',
  },

  css: ['primeicons/primeicons.css', 'primeflex/primeflex.css', '~/assets/fonts/main.scss', '~/assets/styles/layout.scss'],

  app: {
    head: {
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
      timezone: publicConfig.timezone,
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

    components: {
      include: primevueInUse,
    },

    options: {
      ripple: true,
      theme: {
        preset: presetFor(layers.themeLayer?.manifest.primevue, layers.themeLayer?.manifest.primevueTokens),
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
    plugins: [woff2Only()],

    build: {
      chunkSizeWarningLimit: CHUNK_SIZE_WARNING_LIMIT,

      rollupOptions: {
        output: {
          manualChunks: vendorChunks(),
        },
      },
    },

    resolve: {
      alias: [
        { find: /^moment-timezone$/, replacement: 'moment-timezone/builds/moment-timezone-with-data-10-year-range' },
        { find: /^moment$/, replacement: 'moment/moment.js' },
      ],
    },
    optimizeDeps: {
      include: ['quill', 'quill-delta'],
    },
  },

  compatibilityDate: '2025-01-01',
})

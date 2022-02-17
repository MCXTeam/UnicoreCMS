import mainConfig from 'unicore-admin/main.config'

export default mainConfig({
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
    { src: '~/plugins/primevue.ts' }
  ],

  build: {
    transpile: ['primevue']
  },
})

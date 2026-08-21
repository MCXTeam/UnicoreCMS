export default defineNuxtConfig({
  components: [{ path: './components', prefix: 'ModDemo', pathPrefix: false }],
  routeRules: { '/mod/demo/cabinet': { ssr: false } },
})

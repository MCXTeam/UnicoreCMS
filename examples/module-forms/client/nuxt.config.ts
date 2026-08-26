export default defineNuxtConfig({
  components: [{ path: './components', prefix: 'ModForms', pathPrefix: false }],
  routeRules: { '/mod/forms/my': { ssr: false } },
})

import { VueReCaptcha } from 'vue-recaptcha-v3'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  if (config.public.recaptchaPublic) {
    nuxtApp.vueApp.use(VueReCaptcha, {
      siteKey: config.public.recaptchaPublic,
      loaderOptions: { autoHideBadge: true },
    })
  }
})

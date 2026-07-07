import NProgress from 'nprogress'

export default defineNuxtPlugin(() => {
  const router = useRouter()

  router.beforeEach(() => {
    NProgress.start()
  })

  router.afterEach(() => {
    NProgress.done()
  })
})

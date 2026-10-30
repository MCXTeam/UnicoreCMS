export default defineNuxtPlugin(() => {
  if (!useRuntimeConfig().public.licensedFrontend) return
  const check = async () => {
    try {
      const state = await $fetch<{ themeAllowed: boolean; blockedModules: string[] }>('/__unicore/license-state')
      const key = 'unicore-license-ui-state'
      if (state.themeAllowed && !state.blockedModules.length) {
        sessionStorage.removeItem(key)
        return
      }
      const value = JSON.stringify(state)
      if (sessionStorage.getItem(key) === value) return
      sessionStorage.setItem(key, value)
      window.location.reload()
    } catch {}
  }
  let timer: ReturnType<typeof setInterval> | undefined
  onNuxtReady(() => {
    timer = setInterval(check, 15000)
  })
  window.addEventListener(
    'pagehide',
    () => {
      if (timer) clearInterval(timer)
    },
    { once: true },
  )
})

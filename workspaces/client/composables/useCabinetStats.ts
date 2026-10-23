export const useCabinetStats = () => {
  const cabinet = useCabinet()
  const playtime = ref<any[] | null>(null)
  const playtimeError = ref(false)
  let mounted = false
  let pending = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  const visible = () => document.visibilityState !== 'hidden'

  const refresh = async () => {
    if (!mounted || pending || !visible()) return
    pending = true
    controller = new AbortController()
    const signal = controller.signal

    try {
      const times = await cabinet.playtime(signal)
      if (!mounted || signal.aborted) return

      playtimeError.value = false
      playtime.value = times
    } catch {
      if (mounted && !signal.aborted) playtimeError.value = true
    } finally {
      pending = false
      if (mounted && visible()) timer = setTimeout(refresh, 5000)
    }
  }

  const resume = () => {
    clearTimeout(timer)
    void refresh()
  }

  onMounted(() => {
    mounted = true
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('online', resume)
    void refresh()
  })

  onBeforeUnmount(() => {
    mounted = false
    clearTimeout(timer)
    controller?.abort()
    document.removeEventListener('visibilitychange', resume)
    window.removeEventListener('online', resume)
  })

  return { playtime, playtimeError }
}

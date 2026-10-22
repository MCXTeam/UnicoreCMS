export const useCabinetStats = () => {
  const cabinet = useCabinet()
  const playtime = ref<any[] | null>(null)
  const punishments = ref<any[] | null>(null)
  const playtimeError = ref(false)
  const punishmentsError = ref(false)
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
      const [times, penalties] = await Promise.allSettled([cabinet.playtime(signal), cabinet.gamePunishments(signal)])
      if (!mounted || signal.aborted) return

      playtimeError.value = times.status === 'rejected'
      punishmentsError.value = penalties.status === 'rejected'
      if (times.status === 'fulfilled') playtime.value = times.value
      if (penalties.status === 'fulfilled') punishments.value = penalties.value
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

  return { playtime, punishments, playtimeError, punishmentsError }
}

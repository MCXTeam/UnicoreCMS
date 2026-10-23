import type { PunishmentPage, PunishmentPurchaseView, PunishmentTab } from 'unicore-common'

export const usePunishments = (source: () => { own?: boolean; username?: string }) => {
  const api = useApi()
  const auth = useNuxtApp().$auth as any
  const tab = ref<PunishmentTab>('active')
  const category = ref('')
  const search = ref('')
  const page = ref(1)
  const result = ref<PunishmentPage & { reservedBalance?: number; purchases?: PunishmentPurchaseView[]; accountVersion?: string }>({ data: [], counters: { active: 0, history: 0 }, meta: { currentPage: 1, itemsPerPage: 25, totalItems: 0, totalPages: 0 } })
  const loading = ref(false)
  const error = ref(false)
  let mounted = false
  let controller: AbortController | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let generation = 0
  let previousReserve: number | undefined
  let previousAccount: string | undefined

  async function refresh() {
    if (!mounted || document.visibilityState === 'hidden') return
    clearTimeout(timer)
    controller?.abort()
    controller = new AbortController()
    const current = ++generation
    const { own, username } = source()
    const endpoint = own ? '/cabinet/punishments' : username ? `/punishments/public/player/${encodeURIComponent(username)}` : '/punishments/public'
    loading.value = true
    try {
      const { data } = await api.get(endpoint, { signal: controller.signal, params: { tab: tab.value, category: category.value || undefined, page: page.value, search: search.value || undefined } })
      if (!mounted || current !== generation) return
      result.value = data
      if (own && (previousReserve !== undefined && previousReserve !== data.reservedBalance || previousAccount !== undefined && previousAccount !== data.accountVersion)) void auth.fetchUser().catch(() => {})
      previousReserve = data.reservedBalance
      previousAccount = data.accountVersion
      error.value = false
    } catch (failure: any) {
      if (mounted && current === generation && failure.code !== 'ERR_CANCELED') error.value = true
    } finally {
      if (mounted && current === generation) {
        loading.value = false
        timer = setTimeout(refresh, 5000)
      }
    }
  }
  const reset = () => { page.value = 1; void refresh() }
  watch([tab, category], reset)
  watch(page, () => { void refresh() })
  watch(source, reset, { deep: true })
  onMounted(() => {
    mounted = true
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('online', refresh)
    void refresh()
  })
  onBeforeUnmount(() => {
    mounted = false
    generation++
    clearTimeout(timer)
    controller?.abort()
    document.removeEventListener('visibilitychange', refresh)
    window.removeEventListener('online', refresh)
  })
  return { result, loading, error, tab, category, search, page, refresh, reset }
}

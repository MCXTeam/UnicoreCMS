import type { PunishmentPage, PunishmentView } from 'unicore-common'

export function usePunishmentAdmin() {
  const { $api, $t } = useNuxtApp() as any
  const loading = ref(false)
  const error = ref('')
  const options = ref<any>({ groups: [], instances: [], providers: [], servers: [], scopes: [] })
  const result = ref<PunishmentPage>({ data: [], counters: { active: 0, history: 0 }, meta: { currentPage: 1, itemsPerPage: 25, totalItems: 0, totalPages: 0 } })
  const filters = reactive({ tab: 'active', page: 1, search: '', category: '', scopeType: '', scopeId: '', subjectUuid: String(useRoute().query.subjectUuid || '') })
  const selected = ref<PunishmentView | null>(null)
  const api = (method: string, path: string, body?: any) => $api.request({ method, url: `/punishments/admin${path}`, data: body }).then((response: any) => response.data)
  const scopeLabel = (scope: any) => scope.nativeNetworkId ? $t('punishments.native_network', { provider: scope.providerId, scope: scope.nativeNetworkId === '*' ? $t('punishments.native_network_all') : scope.nativeNetworkId }) : scope.name ? `${$t(`punishments.scope_${scope.type}`)}: ${scope.name}` : $t(scope.type === 'ACCOUNT' ? 'punishments.account_scope' : 'punishments.project_scope')
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  let mounted = false
  let generation = 0

  async function load() {
    if (!mounted || document.visibilityState === 'hidden') return
    clearTimeout(timer)
    controller?.abort()
    controller = new AbortController()
    const current = ++generation
    loading.value = true
    try {
      const response = await $api.get('/punishments/admin', { signal: controller.signal, params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')) })
      if (!mounted || current !== generation) return
      result.value = response.data
      error.value = ''
    } catch (failure: any) {
      if (mounted && current === generation && failure.code !== 'ERR_CANCELED') error.value = $t('punishments.load_error')
    } finally {
      if (mounted && current === generation) { loading.value = false; timer = setTimeout(load, 5000) }
    }
  }
  async function reload() {
    try { options.value = await api('get', '/options') } catch { error.value = $t('punishments.load_error') }
    await load()
  }
  async function action(method: string, path: string, body?: any) {
    try { const result = await api(method, path, body); error.value = ''; await reload(); return result }
    catch (failure: any) { error.value = typeof failure.response?.data?.message === 'string' ? failure.response.data.message : $t('admin.invalid_data'); throw failure }
  }
  watch(() => ({ ...filters }), () => { void load() }, { deep: true })
  onMounted(() => { mounted = true; document.addEventListener('visibilitychange', load); window.addEventListener('online', load); void reload() })
  onBeforeUnmount(() => { mounted = false; generation++; clearTimeout(timer); controller?.abort(); document.removeEventListener('visibilitychange', load); window.removeEventListener('online', load) })
  return { loading, error, options, result, filters, selected, api, action, load, reload, scopeLabel }
}

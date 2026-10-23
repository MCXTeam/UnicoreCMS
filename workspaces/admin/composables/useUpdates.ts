export function useUpdates() {
  const { $api, $t } = useNuxtApp() as any
  const status = ref<any>({ configured: false, installation: null, operations: [], jobs: [] })
  const releases = ref<any[]>([])
  const loading = ref(false)
  const busy = ref(false)
  const error = ref('')
  const adoption = ref<any>(null)
  let alive = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  const operation = computed<any>(() => status.value.operations?.[0])
  const pending = computed(() => status.value.jobs?.some((j: any) => ['queued', 'running'].includes(j.state)))
  const message = (key: string) => {
    const value = $t(key)
    return value === key ? $t('updates.operation_failed') : value
  }
  async function load() {
    if (!alive) return
    controller?.abort()
    const requestController = (controller = new AbortController())
    try {
      const response = await $api.get('/admin/updates', { signal: requestController.signal })
      if (!alive || controller !== requestController) return
      status.value = response.data
      const jobs = [...(status.value.jobs || [])].sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
      const last = jobs[0]
      if (last?.action === 'adopt' && last.state === 'completed' && last.result?.fingerprint) adoption.value = last.result
      error.value = last?.state === 'failed' ? message(`updates.error.${last.error}`) : ''
    } catch (failure: any) {
      if (alive && controller === requestController && failure.code !== 'ERR_CANCELED') error.value = $t('updates.runner_unavailable')
    } finally {
      if (alive && controller === requestController) {
        loading.value = false
        timer = setTimeout(load, pending.value ? 1000 : 5000)
      }
    }
  }
  async function refresh() {
    if (timer) clearTimeout(timer)
    loading.value = true
    await load()
  }
  async function discover() {
    busy.value = true
    try {
      const response = await $api.get('/admin/updates/releases')
      releases.value = response.data
      error.value = ''
    } catch {
      error.value = $t('updates.release_error')
    } finally {
      busy.value = false
    }
  }
  async function action(name: string, input: any) {
    if (busy.value || pending.value) return false
    busy.value = true
    error.value = ''
    try {
      await $api.post(`/admin/updates/${name}`, input)
      await refresh()
      return true
    } catch (failure: any) {
      error.value =
        typeof failure.response?.data?.message === 'string' ? message(failure.response.data.message) : $t('updates.operation_failed')
      return false
    } finally {
      busy.value = false
    }
  }
  onMounted(() => {
    alive = true
    void refresh()
  })
  onBeforeUnmount(() => {
    alive = false
    if (timer) clearTimeout(timer)
    controller?.abort()
  })
  return { status, releases, operation, pending, loading, busy, error, adoption, refresh, discover, action, message }
}

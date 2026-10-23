export function useUserHardware(userUuid: Ref<string>) {
  const { $api, $t } = useNuxtApp() as any
  const devices = ref<any[]>([])
  const loading = ref(false)
  const busy = ref(false)
  const error = ref('')
  let controller: AbortController | undefined
  let generation = 0
  let active = false

  async function load() {
    if (!active || !userUuid.value) return
    controller?.abort()
    controller = new AbortController()
    const current = ++generation
    loading.value = true
    try {
      const response = await $api.get(`/admin/hardware/users/${userUuid.value}`, { signal: controller.signal })
      if (active && current === generation) { devices.value = response.data.data; error.value = '' }
    } catch (failure: any) {
      if (active && current === generation && failure.code !== 'ERR_CANCELED') error.value = $t('hardware.load_error')
    } finally { if (current === generation) loading.value = false }
  }

  async function action(path: string, body: any) {
    if (busy.value) return false
    busy.value = true
    error.value = ''
    try { await $api.post(`/admin/hardware${path}`, body); await load(); return true }
    catch (failure: any) { error.value = typeof failure.response?.data?.message === 'string' ? failure.response.data.message : $t('admin.invalid_data'); return false }
    finally { busy.value = false }
  }

  watch(userUuid, () => { devices.value = []; void load() })
  onMounted(() => { active = true; void load() })
  onBeforeUnmount(() => { active = false; generation++; controller?.abort() })
  return { devices, loading, busy, error, load, action }
}

<template>
  <section class="updater-setup" :aria-busy="busy" aria-labelledby="updater-setup-title">
    <h2 id="updater-setup-title">{{ $t('updates.setup.title') }}</h2>
    <p>{{ $t('updates.setup.description') }}</p>
    <Message v-if="error" severity="error" :closable="false" role="alert">{{ error }}</Message>
    <ol class="updater-setup-steps">
      <li>{{ $t('updates.setup.detect') }}</li>
      <li>{{ $t('updates.setup.connect') }}</li>
      <li>{{ $t('updates.setup.baseline') }}</li>
    </ol>
    <template v-if="discovery">
      <dl class="updater-setup-checks">
        <div v-for="(passed, key) in visibleChecks" :key="key">
          <dt>{{ $t(`updates.setup.check.${key}`) }}</dt>
          <dd><Tag :severity="passed === true ? 'success' : 'warn'" :value="$t(passed === true ? 'updates.setup.available' : passed === null ? 'updates.setup.checking' : 'updates.setup.required')" /></dd>
        </div>
      </dl>
      <p v-if="working" role="status" aria-live="polite">{{ $t('updates.setup.working') }}</p>
      <template v-else-if="discovery.canConnect && discovery.mode === 'pm2'">
        <p>{{ $t('updates.setup.pm2') }}</p>
        <Button v-if="canSetup" :label="$t('updates.setup.connect_button')" :loading="busy" @click="connect" />
      </template>
      <template v-else-if="discovery.mode === 'container' || discovery.pterodactylAvailable">
        <Button v-if="canSetup && !showPtero" :label="$t('updates.ptero.choose')" outlined @click="showPtero = true" />
        <UpdaterPterodactyl v-if="showPtero && canSetup" @restarting="restarting" />
        <Button v-if="showPtero" :label="$t('common.back')" text @click="showPtero = false" />
        <template v-if="!showPtero && discovery.hostCommand">
          <p>{{ $t('updates.setup.host_description') }}</p>
          <pre tabindex="0">{{ discovery.hostCommand }}</pre>
          <p>{{ $t('updates.setup.host_done') }}</p>
        </template>
      </template>
      <p v-else-if="discovery.mode === 'pterodactyl'">{{ $t('updates.ptero.managed') }}</p>
      <template v-else-if="discovery.mode === 'manual'">
        <p>{{ $t('updates.setup.restart_description') }}</p>
        <pre tabindex="0">{{ discovery.command }}</pre>
      </template>
      <Message v-if="discovery.checks.docker === false && discovery.checks.linux && !showPtero" severity="warn" :closable="false">{{ $t('updates.setup.docker_required') }}</Message>
      <Message v-if="!discovery.checks.linux" severity="info" :closable="false">{{ $t('updates.setup.linux_required') }}</Message>
    </template>
    <Button :label="$t('updates.setup.check_button')" outlined :loading="busy" @click="check" />
  </section>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
const { $api, $t } = useNuxtApp() as any
const emit = defineEmits(['connected'])
const discovery = ref<any>(null)
const busy = ref(false)
const error = ref('')
const showPtero = ref(false)
const visibleChecks = computed(() => Object.fromEntries(Object.entries(discovery.value?.checks || {}).filter(([key]) => !showPtero.value || key !== 'docker')))
const auth = useAuthStore()
const canSetup = computed(() => auth.has('panel.updates.setup'))
const working = computed(() => ['connecting', 'preparing', 'starting'].includes(discovery.value?.state))
let timer: ReturnType<typeof setTimeout> | undefined
let alive = true
let controller: AbortController | undefined
async function check() {
  if (busy.value) return
  if (timer) clearTimeout(timer)
  busy.value = true
  controller = new AbortController()
  try {
    const response = await $api.get('/admin/updates/setup', { signal: controller.signal })
    if (!alive) return
    discovery.value = response.data
    error.value = response.data.error ? $t(`updates.error.${response.data.error}`) : ''
    if (response.data.state === 'ready') emit('connected')
  } catch (failure: any) {
    if (alive && failure.code !== 'ERR_CANCELED') error.value = $t('updates.setup.check_failed')
  } finally {
    if (alive) {
      busy.value = false
      if (working.value) timer = setTimeout(check, 3000)
    }
  }
}
async function connect() {
  busy.value = true
  error.value = ''
  try {
    await $api.post('/admin/updates/setup')
    if (alive) discovery.value.state = 'connecting'
  } catch {
    if (alive) error.value = $t('updates.setup.connect_failed')
  } finally {
    if (alive) { busy.value = false; timer = setTimeout(check, 3000) }
  }
}
function restarting() { discovery.value.state = 'starting'; timer = setTimeout(check, 5000) }
onMounted(check)
onBeforeUnmount(() => { alive = false; if (timer) clearTimeout(timer); controller?.abort() })
</script>

<style scoped>
.updater-setup { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; min-width: 0; }
.updater-setup h2, .updater-setup p { margin: 0; }
.updater-setup-steps { margin: 0; padding-inline-start: 1.5rem; line-height: 1.75; }
.updater-setup-checks { display: grid; gap: 0.75rem; margin: 0; }
.updater-setup-checks > div { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.updater-setup-checks dd { margin: 0; }
.updater-setup pre { max-width: 100%; white-space: pre-wrap; overflow-wrap: anywhere; padding: 1rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
.updater-setup :deep(button) { justify-self: start; max-width: 100%; }
</style>

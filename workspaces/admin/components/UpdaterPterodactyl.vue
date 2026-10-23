<template>
  <form class="updater-ptero" :aria-busy="busy" @submit.prevent="inspect">
    <h3>{{ $t('updates.ptero.title') }}</h3>
    <p>{{ $t('updates.ptero.description') }}</p>
    <Message v-if="error" severity="error" :closable="false" role="alert">{{ error }}</Message>
    <template v-if="!restarting">
      <div class="updater-ptero-field">
        <label for="updater-ptero-url">{{ $t('updates.ptero.url') }}</label>
        <InputText id="updater-ptero-url" v-model="url" type="url" placeholder="https://panel.example.org" required :disabled="busy" @update:model-value="invalidate" />
      </div>
      <div class="updater-ptero-field">
        <label for="updater-ptero-server">{{ $t('updates.ptero.server') }}</label>
        <InputText id="updater-ptero-server" v-model="server" placeholder="a1b2c3d4" required :disabled="busy" @update:model-value="invalidate" />
      </div>
      <div class="updater-ptero-field">
        <label for="updater-ptero-token">{{ $t('updates.ptero.token') }}</label>
        <InputText id="updater-ptero-token" v-model="token" type="password" autocomplete="off" required :disabled="busy" aria-describedby="updater-ptero-token-help" @update:model-value="invalidate" />
        <small id="updater-ptero-token-help">{{ $t('updates.ptero.token_help') }}</small>
      </div>
      <Button type="submit" :label="$t('updates.ptero.inspect')" :loading="busy" />
      <div v-if="plan" class="updater-ptero-plan" role="status" aria-live="polite">
        <p><strong>{{ plan.name }}</strong></p>
        <p>{{ $t('updates.ptero.image') }} <code>{{ plan.image }}</code></p>
        <template v-if="plan.allowed">
          <p>{{ $t('updates.ptero.confirm_description') }}</p>
          <label class="updater-ptero-confirm"><Checkbox v-model="confirmed" binary input-id="updater-ptero-confirm" />{{ $t('updates.ptero.confirm') }}</label>
          <Button type="button" :label="$t('updates.ptero.apply')" :disabled="!confirmed || busy" :loading="busy" @click="apply" />
        </template>
        <Message v-else severity="warn" :closable="false">
          {{ $t('updates.ptero.image_unavailable') }}
          <a :href="plan.eggUrl" target="_blank" rel="noopener noreferrer">{{ $t('updates.ptero.egg') }}</a>
        </Message>
      </div>
    </template>
    <p v-else role="status" aria-live="polite">{{ $t('updates.ptero.restarting') }}</p>
  </form>
</template>

<script setup lang="ts">
const { $api, $t } = useNuxtApp() as any
const emit = defineEmits(['restarting'])
const url = ref('')
const server = ref('')
const token = ref('')
const plan = ref<any>(null)
const confirmed = ref(false)
const busy = ref(false)
const error = ref('')
const restarting = ref(false)
let alive = true
let controller: AbortController | undefined
function invalidate() { plan.value = null; confirmed.value = false; error.value = '' }
async function request(action: string) {
  if (busy.value) return
  if (action === 'inspect') { plan.value = null; confirmed.value = false }
  busy.value = true
  error.value = ''
  controller = new AbortController()
  try {
    const response = await $api.post('/admin/updates/setup/pterodactyl', { action, url: url.value, server: server.value, token: token.value, fingerprint: plan.value?.fingerprint }, { signal: controller.signal })
    if (!alive) return
    if (action === 'inspect') plan.value = response.data
    else { token.value = ''; restarting.value = true; emit('restarting') }
  } catch (failure: any) {
    if (alive && failure.code !== 'ERR_CANCELED') {
      const key = failure.response?.data?.message
      error.value = $t(typeof key === 'string' && key.startsWith('updates.error.pterodactyl_') ? key : 'updates.ptero.failed')
    }
  } finally { if (alive) busy.value = false }
}
async function inspect() { await request('inspect') }
async function apply() { if (confirmed.value && plan.value?.allowed) await request('apply') }
onBeforeUnmount(() => { alive = false; token.value = ''; controller?.abort() })
</script>

<style scoped>
.updater-ptero, .updater-ptero-field, .updater-ptero-plan { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; min-width: 0; }
.updater-ptero-field { gap: 0.5rem; }
.updater-ptero h3, .updater-ptero p { margin: 0; }
.updater-ptero input { width: 100%; }
.updater-ptero small { line-height: 1.5; }
.updater-ptero code { overflow-wrap: anywhere; }
.updater-ptero-confirm { display: flex; gap: 0.75rem; align-items: center; cursor: pointer; }
.updater-ptero :deep(button) { justify-self: start; max-width: 100%; }
</style>

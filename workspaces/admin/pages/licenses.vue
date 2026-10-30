<template>
  <div class="card">
    <div class="license-heading">
      <div>
        <h1 class="m-0">{{ $t('licensing.title') }}</h1>
        <p class="text-color-secondary mb-0">{{ $t('licensing.hint') }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button
          v-if="canManage"
          :label="$t('licensing.activate')"
          icon="pi pi-key"
          :disabled="loading || !configured"
          @click="openActivation()"
        />
        <Button :label="$t('admin.refresh')" icon="pi pi-refresh" outlined :loading="loading" @click="load()" />
        <Button
          v-if="canManage"
          :label="$t('licensing.check_now')"
          icon="pi pi-sync"
          text
          :disabled="loading || !configured"
          @click="checkNow()"
        />
      </div>
    </div>
    <Message v-if="!loading && !configured" severity="warn" :closable="false">{{ $t('licensing.not_configured') }}</Message>
    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <Message v-if="saved" severity="info" :closable="false">{{ $t('licensing.restart_hint') }}</Message>
    <ExtensionList :items="entries" itemKey="key" :loading="loading">
      <template #empty
        ><p class="text-color-secondary">{{ $t('licensing.empty') }}</p></template
      >
      <template #summary="{ item }">
        <h3>{{ item.id }}</h3>
        <small>{{ $t(item.kind === 'module' ? 'licensing.kind_module' : 'licensing.kind_theme') }} · {{ item.productId }}</small>
        <p v-if="item.releaseId">{{ $t('licensing.release') }}: {{ item.releaseId }}</p>
      </template>
      <template #state="{ item }">
        <Tag :severity="item.allowed ? 'success' : 'warn'" :value="$t(item.allowed ? 'licensing.active' : 'licensing.blocked')" />
        <small class="block mt-2">{{
          item.allowed ? $t('licensing.valid_until', { date: date(item.expiresAt) }) : reason(item.reason)
        }}</small>
      </template>
      <template #item-actions="{ item }">
        <Button
          v-if="canManage && !item.activated"
          :label="$t('licensing.activate')"
          icon="pi pi-key"
          outlined
          :disabled="!configured"
          @click="openActivation(item)"
        />
        <Button
          v-if="canManage && item.activated"
          :label="$t('licensing.transfer_action')"
          icon="pi pi-arrow-right-arrow-left"
          outlined
          :disabled="!configured"
          @click="openTransfer(item)"
        />
      </template>
    </ExtensionList>

    <Dialog
      v-model:visible="activationVisible"
      modal
      :header="$t('licensing.activate')"
      :style="{ width: '560px' }"
      class="p-fluid"
      @hide="clearSecrets"
    >
      <Message severity="info" :closable="false">{{ $t('licensing.one_installation') }}</Message>
      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
      <form @submit.prevent="activate">
        <div class="field">
          <label :for="`${uid}-mode`">{{ $t('licensing.activation_type') }}</label>
          <Select :inputId="`${uid}-mode`" v-model="activationMode" :options="activationModes" optionLabel="label" optionValue="value" />
        </div>
        <div class="field">
          <label :for="`${uid}-kind`">{{ $t('licensing.kind') }}</label>
          <Select :inputId="`${uid}-kind`" v-model="activation.kind" :options="kinds" optionLabel="label" optionValue="value" />
        </div>
        <div class="field">
          <label :for="`${uid}-id`">{{ $t('licensing.extension_id') }}</label
          ><InputText :id="`${uid}-id`" v-model="activation.id" autocomplete="off" required />
        </div>
        <div class="field">
          <label :for="`${uid}-product`">{{ $t('licensing.product_id') }}</label
          ><InputText :id="`${uid}-product`" v-model="activation.productId" autocomplete="off" required />
        </div>
        <div class="field">
          <label :for="`${uid}-release`">{{ $t('licensing.release') }}</label
          ><InputText :id="`${uid}-release`" v-model="activation.releaseId" autocomplete="off" required />
        </div>
        <div class="field">
          <label :for="`${uid}-secret`">{{ $t(activationMode === 'transfer' ? 'licensing.transfer_code' : 'licensing.key') }}</label>
          <Password :inputId="`${uid}-secret`" v-model="secret" :feedback="false" toggleMask autocomplete="off" />
        </div>
      </form>
      <template #footer>
        <Button :label="$t('common.cancel')" text :disabled="pending" @click="activationVisible = false" />
        <Button :label="$t('licensing.activate')" icon="pi pi-key" :loading="pending" :disabled="!activationValid" @click="activate" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="transferVisible"
      modal
      :header="$t('licensing.transfer')"
      :style="{ width: '560px' }"
      class="p-fluid"
      @hide="clearSecrets"
    >
      <p>{{ selected?.id }}</p>
      <Message severity="warn" :closable="false">{{ $t('licensing.transfer_hint') }}</Message>
      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
      <div v-if="!transferResult" class="field">
        <label :for="`${uid}-origin`">{{ $t('licensing.target_origin') }}</label>
        <InputText :id="`${uid}-origin`" v-model="targetOrigin" placeholder="https://" autocomplete="off" />
      </div>
      <div v-else>
        <p>{{ $t('licensing.transfer_ready', { date: date(transferResult.readyAt) }) }}</p>
        <div class="field">
          <label :for="`${uid}-transfer-code`">{{ $t('licensing.transfer_code') }}</label
          ><Password :inputId="`${uid}-transfer-code`" :modelValue="transferResult.transferCode" readonly :feedback="false" toggleMask />
        </div>
        <small class="text-color-secondary">{{ $t('licensing.secret_once') }}</small>
      </div>
      <template #footer>
        <Button :label="$t('common.cancel')" text :disabled="pending" @click="transferVisible = false" />
        <Button
          v-if="!transferResult"
          :label="$t('licensing.create_transfer')"
          :loading="pending"
          :disabled="!targetOrigin"
          @click="transfer"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="replacementVisible"
      modal
      :header="$t('licensing.replacement_key')"
      :style="{ width: '560px' }"
      class="p-fluid"
      @hide="clearSecrets"
    >
      <p>{{ $t('licensing.secret_once') }}</p>
      <label :for="`${uid}-replacement`">{{ $t('licensing.key') }}</label>
      <Password :inputId="`${uid}-replacement`" :modelValue="replacementKey" readonly :feedback="false" toggleMask />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { isAxiosError } from 'axios'
import type { LicenseEntry } from 'unicore-api/licensing'

const { $api, $t } = useNuxtApp()
const { canManage } = useAccess({ canManage: 'panel.extensions.manage' })
useHead({ title: computed(() => $t('licensing.title')) })
const uid = useId()
const entries = ref<LicenseEntry[]>([]),
  configured = ref(false),
  loading = ref(true),
  pending = ref(false),
  saved = ref(false),
  error = ref('')
const activationVisible = ref(false),
  transferVisible = ref(false),
  replacementVisible = ref(false)
const activationMode = ref('license'),
  secret = ref(''),
  replacementKey = ref(''),
  targetOrigin = ref('')
const selected = ref<LicenseEntry | null>(null)
const transferResult = ref<{ transferCode: string; readyAt: number; expiresAt: number } | null>(null)
const activation = reactive({ kind: 'module', id: '', productId: '', releaseId: '' })
const kinds = computed(() => [
  { label: $t('licensing.kind_module'), value: 'module' },
  { label: $t('licensing.kind_theme'), value: 'theme' },
])
const activationModes = computed(() => [
  { label: $t('licensing.key'), value: 'license' },
  { label: $t('licensing.transfer_code'), value: 'transfer' },
])
const activationValid = computed(() => Boolean(secret.value && activation.id && activation.productId && activation.releaseId))
const date = (value: number) => new Date(value).toLocaleString()
const reasons = new Set([
  'activation_required',
  'licensing_not_configured',
  'runtime_expired',
  'runtime_denied',
  'license_service_unavailable',
  'revoked',
  'artifact_tampered',
  'not_selected',
  'commercial_marker_missing',
  'unknown_commercial_product',
  'coordinator_unavailable',
])
const reason = (value: string | null) => $t(`licensing.reason.${reasons.has(value || '') ? value : 'operation_failed'}`)
function clearSecrets() {
  secret.value = ''
  transferResult.value = null
  if (!replacementVisible.value) replacementKey.value = ''
}
function failure(value: unknown) {
  const key = isAxiosError<{ message?: unknown }>(value) ? value.response?.data?.message : undefined
  error.value = $t(typeof key === 'string' && key.startsWith('licensing.') ? key : 'licensing.error.operation_failed')
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await $api.get('/admin/licenses')
    configured.value = data.configured
    entries.value = data.entries
  } catch (value) {
    failure(value)
  } finally {
    loading.value = false
  }
}
function openActivation(item?: LicenseEntry) {
  clearSecrets()
  error.value = ''
  activationMode.value = 'license'
  Object.assign(activation, {
    kind: item?.kind || 'module',
    id: item?.id || '',
    productId: item?.productId || '',
    releaseId: item?.releaseId || '',
  })
  activationVisible.value = true
}
function openTransfer(item: LicenseEntry) {
  clearSecrets()
  selected.value = item
  targetOrigin.value = ''
  error.value = ''
  transferVisible.value = true
}
async function checkNow() {
  loading.value = true
  error.value = ''
  try {
    await $api.post('/admin/licenses/refresh')
    await load()
  } catch (value) {
    failure(value)
  } finally {
    loading.value = false
  }
}
async function activate() {
  if (!activationValid.value || pending.value) return
  pending.value = true
  error.value = ''
  try {
    const { data } = await $api.post('/admin/licenses/activate', {
      ...activation,
      [activationMode.value === 'transfer' ? 'transferCode' : 'licenseKey']: secret.value,
    })
    secret.value = ''
    activationVisible.value = false
    saved.value = true
    if (data.replacementKey) {
      replacementKey.value = data.replacementKey
      replacementVisible.value = true
    }
    await load()
  } catch (value) {
    failure(value)
  } finally {
    pending.value = false
  }
}
async function transfer() {
  if (!selected.value || pending.value || !targetOrigin.value) return
  pending.value = true
  error.value = ''
  try {
    const { data } = await $api.post('/admin/licenses/transfer', {
      kind: selected.value.kind,
      id: selected.value.id,
      targetOrigin: targetOrigin.value,
    })
    transferResult.value = data
    await load()
  } catch (value) {
    failure(value)
  } finally {
    pending.value = false
  }
}
onMounted(load)
onBeforeUnmount(() => {
  secret.value = ''
  replacementKey.value = ''
  transferResult.value = null
})
</script>

<style scoped>
.license-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}
.license-heading > div {
  min-width: 0;
}
</style>

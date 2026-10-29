<template>
  <div class="grid payment-settings">
    <div v-if="error || notice" class="col-12" aria-live="polite">
      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
      <Message v-if="notice" severity="success" :closable="false">{{ notice }}</Message>
    </div>
    <div v-if="loading" class="col-12"><div class="card" role="status">{{ $t('common.loading') }}</div></div>
    <template v-else>
      <div class="col-12">
        <form class="card" @submit.prevent="saveRates">
          <div class="payment-settings__heading">
            <h1 class="m-0">{{ $t('admin.payment_rates_title') }}</h1>
            <Button v-if="canUpdate" type="submit" :label="$t('common.save')" icon="pi pi-check" :loading="savingRates" />
          </div>
          <div class="formgrid grid mt-4">
            <div class="field col-12 md:col-6">
              <label for="payment-rate-mode">{{ $t('admin.payment_rate_source') }}</label>
              <Select id="payment-rate-mode" v-model="rates.mode" :options="rateModes" optionLabel="label" optionValue="value" class="w-full" :disabled="!canUpdate" />
            </div>
            <div class="field col-12 md:col-6">
              <label for="payment-base-currency">{{ $t('admin.payment_base_currency') }}</label>
              <InputText id="payment-base-currency" :modelValue="rates.baseCurrency" class="w-full" readonly />
            </div>
          </div>
          <p class="text-color-secondary">{{ $t('admin.payment_rates_hint') }}</p>
          <template v-if="rates.mode === 'cbr'">
            <div class="payment-settings__heading mb-3">
              <span>{{ snapshot ? $t('admin.payment_rate_date', { date: snapshot.date }) : $t('admin.payment_rates_not_loaded') }}</span>
              <Button v-if="canUpdate" type="button" :label="$t('admin.payment_rates_refresh')" icon="pi pi-refresh" :loading="refreshing" outlined @click="refreshRates" />
            </div>
            <Message v-if="stale" severity="warn" :closable="false">{{ $t('admin.payment_rates_stale') }}</Message>
            <div v-if="snapshot" class="payment-settings__rates">
              <div v-for="code in currencies" :key="code" class="payment-settings__rate">
                <span>1 {{ code }}</span><strong>{{ snapshot.rates[code] ?? $t('admin.payment_rate_missing') }} RUB</strong>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="payment-settings__rates">
              <div v-for="(value, code) in rates.manualRates" :key="code" class="payment-settings__rate">
                <label :for="`rate-${code}`">1 {{ code }} = RUB</label>
                <InputNumber :inputId="`rate-${code}`" v-model="rates.manualRates[code]" :min="0.00000001" :maxFractionDigits="8" :disabled="!canUpdate || code === 'RUB'" :useGrouping="false" />
                <Button v-if="canUpdate && code !== 'RUB'" type="button" icon="pi pi-times" text :aria-label="$t('admin.payment_rate_remove', { code })" @click="removeRate(String(code))" />
              </div>
            </div>
            <div v-if="canUpdate" class="payment-settings__add-rate mt-3">
              <label for="payment-new-currency">{{ $t('admin.payment_rate_add') }}</label>
              <InputText id="payment-new-currency" v-model="newCurrency" maxlength="3" placeholder="USD" :aria-label="$t('admin.payment_rate_add')" />
              <Button type="button" :label="$t('admin.add')" icon="pi pi-plus" outlined :disabled="!/^[a-z]{3}$/i.test(newCurrency)" @click="addRate" />
            </div>
          </template>
        </form>
      </div>
      <div class="col-12 lg:col-4">
        <div class="card payment-settings__providers">
          <h2>{{ $t('admin.payment_gateways_title') }}</h2>
          <div class="payment-settings__provider-list" role="group" :aria-label="$t('admin.payment_gateways_title')">
            <button v-for="provider in providers" :key="provider.id" type="button" class="payment-settings__provider" :class="{ 'payment-settings__provider--selected': selected === provider.id }" :aria-pressed="selected === provider.id" @click="selectProvider(provider.id)">
              <span>{{ provider.name }}</span>
              <span class="payment-settings__status"><i class="pi" :class="provider.enabled ? 'pi-check-circle' : 'pi-circle'" aria-hidden="true"></i>{{ $t(provider.enabled ? 'admin.payment_enabled' : 'admin.payment_disabled') }}</span>
            </button>
          </div>
        </div>
      </div>
      <div v-if="draft" class="col-12 lg:col-8">
        <form class="card" @submit.prevent="saveProvider">
          <div class="payment-settings__heading">
            <h2 class="m-0">{{ draft.name }}</h2>
            <a :href="draft.docs" target="_blank" rel="noopener noreferrer">{{ $t('admin.payment_documentation') }} <i class="pi pi-external-link" aria-hidden="true"></i></a>
          </div>
          <div class="field-checkbox mt-4">
            <Checkbox inputId="gateway-enabled" v-model="draft.enabled" :binary="true" :disabled="!canUpdate" />
            <label for="gateway-enabled">{{ $t('admin.payment_enable') }}</label>
          </div>
          <Message v-if="draft.id === 'tebex'" severity="info" :closable="false">{{ $t(draft.values.mode === 'headless' ? 'admin.payment_tebex_headless_hint' : 'admin.payment_tebex_checkout_hint') }}</Message>
          <Message v-if="draft.id === 'webmoney'" severity="info" :closable="false">{{ $t('admin.payment_webmoney_hint') }}</Message>
          <Message v-if="draft.id === 'lava'" severity="info" :closable="false">{{ $t('admin.payment_lava_hint') }}</Message>
          <div class="formgrid grid mt-4">
            <div v-for="field in visibleFields" :key="field.key" class="field col-12 md:col-6">
              <label :for="`gateway-${field.key}`">{{ $t(`admin.payment_field_${field.key}`) }}<span v-if="field.required && draft.enabled" class="p-error"> *</span></label>
              <Password v-if="field.secret" :inputId="`gateway-${field.key}`" v-model="draft.values[field.key]" :feedback="false" toggleMask class="w-full" inputClass="w-full" autocomplete="new-password" :disabled="!canUpdate" :placeholder="draft.configured[field.key] ? $t('admin.payment_secret_saved') : ''" />
              <Select v-else-if="field.options" :inputId="`gateway-${field.key}`" v-model="draft.values[field.key]" :options="field.options.map(value => ({ value, label: optionLabel(value) }))" optionLabel="label" optionValue="value" class="w-full" :disabled="!canUpdate" />
              <InputText v-else :id="`gateway-${field.key}`" v-model="draft.values[field.key]" class="w-full" :disabled="!canUpdate" :required="draft.enabled && field.required" :maxlength="field.key === 'currency' ? 3 : 4096" />
              <small v-if="field.secret && draft.configured[field.key]" class="text-color-secondary">{{ $t('admin.payment_secret_hint') }}</small>
            </div>
          </div>
          <div class="field">
            <label :for="`callback-${draft.id}`">{{ $t('admin.payment_callback') }}</label>
            <InputText :id="`callback-${draft.id}`" :modelValue="callbackUrl" readonly class="w-full" @focus="($event.target as HTMLInputElement).select()" />
            <small class="text-color-secondary">{{ $t('admin.payment_callback_hint') }}</small>
          </div>
          <Button v-if="canUpdate" type="submit" :label="$t('common.save')" icon="pi pi-check" :loading="savingProvider" />
        </form>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const { $api, $t: t } = useNuxtApp()
const runtimeConfig = useRuntimeConfig()
const { canUpdate } = useAccess({ canUpdate: 'panel.config.update' })
type Field = { key: string; secret?: boolean; required?: boolean; options?: string[] }
type Provider = { id: string; name: string; docs: string; enabled: boolean; values: Record<string, string>; configured: Record<string, boolean>; fields: Field[] }
type Snapshot = { date: string; fetchedAt: number; rates: Record<string, number>; stale?: boolean }
const providers = ref<Provider[]>([])
const rates = ref<{ mode: string; baseCurrency: string; manualRates: Record<string, number> }>({ mode: 'cbr', baseCurrency: 'RUB', manualRates: { RUB: 1 } })
const snapshot = ref<Snapshot | null>(null)
const selected = ref('')
const draft = ref<Provider | null>(null)
const loading = ref(true)
const savingRates = ref(false)
const savingProvider = ref(false)
const refreshing = ref(false)
const newCurrency = ref('')
const error = ref('')
const notice = ref('')
const rateModes = computed(() => [{ value: 'cbr', label: t('admin.payment_rates_cbr') }, { value: 'manual', label: t('admin.payment_rates_manual') }])
const currencies = computed(() => [...new Set([rates.value.baseCurrency.toUpperCase(), 'RUB', 'USD', 'EUR', 'CNY', ...providers.value.map(item => item.values.currency)])].filter(Boolean))
const stale = computed(() => snapshot.value?.stale || (snapshot.value && Date.now() - snapshot.value.fetchedAt > 3600000))
const callbackUrl = computed(() => `${String(runtimeConfig.public.apiBaseurl).replace(/\/$/, '')}/payment/methods/${selected.value}/handler`)
const visibleFields = computed(() => (draft.value?.fields || []).filter(field => {
  if (draft.value?.id === 'tebex') {
    if (['publicToken', 'categoryId'].includes(field.key)) return draft.value.values.mode === 'headless'
    if (field.key === 'projectId') return draft.value.values.mode === 'checkout'
  }
  return !['vat', 'taxSystem', 'paymentSubject', 'paymentMode'].includes(field.key) || draft.value?.values.receipts === 'true'
}))
function optionLabel(value: string) { return ['true', 'false', 'checkout', 'headless'].includes(value) ? t(`admin.payment_option_${value}`) : value }
function selectProvider(id: string) { selected.value = id; draft.value = JSON.parse(JSON.stringify(providers.value.find(item => item.id === id))); notice.value = ''; error.value = '' }
function addRate() { const code = newCurrency.value.toUpperCase(); if (/^[A-Z]{3}$/.test(code) && !(code in rates.value.manualRates)) rates.value.manualRates[code] = 0; newCurrency.value = '' }
function removeRate(code: string) { delete rates.value.manualRates[code] }
async function saveRates() {
  error.value = ''; notice.value = ''; savingRates.value = true
  try { const response = await $api.patch('/admin/payment-settings/rates', { ...rates.value, baseCurrency: rates.value.baseCurrency.toUpperCase() }); rates.value = response.data; notice.value = t('admin.payment_saved') }
  catch { error.value = t('admin.payment_save_error') }
  finally { savingRates.value = false }
}
async function refreshRates() {
  error.value = ''; refreshing.value = true
  try { snapshot.value = (await $api.post('/admin/payment-settings/rates/refresh')).data }
  catch { error.value = t('admin.payment_rates_error') }
  finally { refreshing.value = false }
}
async function saveProvider() {
  if (!draft.value) return
  error.value = ''; notice.value = ''; savingProvider.value = true
  try {
    const current = draft.value
    const values = { ...current.values, currency: current.values.currency.toUpperCase() }
    const result = (await $api.patch(`/admin/payment-settings/${current.id}`, { enabled: current.enabled, values })).data
    providers.value = providers.value.map(item => item.id === result.id ? result : item)
    selectProvider(result.id); notice.value = t('admin.payment_saved')
  } catch { error.value = t('admin.payment_save_error') }
  finally { savingProvider.value = false }
}
onMounted(async () => {
  try { const { data } = await $api.get('/admin/payment-settings'); providers.value = data.providers; rates.value = data.rates; snapshot.value = data.snapshot; if (providers.value.length) selectProvider(providers.value[0].id) }
  catch { error.value = t('admin.payment_load_error') }
  finally { loading.value = false }
})
</script>

<style scoped>
.payment-settings__heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.payment-settings__providers { padding: var(--ui-card-padding) 0; }
.payment-settings__providers h2 { padding: 0 var(--ui-card-padding); }
.payment-settings__provider-list { display: flex; flex-direction: column; }
.payment-settings__provider { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; width: 100%; padding: 12px var(--ui-card-padding); border: 0; background: transparent; color: var(--text-color); font: inherit; text-align: left; cursor: pointer; }
.payment-settings__provider:hover { background: var(--surface-hover); }
.payment-settings__provider--selected { background: var(--highlight-bg); color: var(--highlight-text-color); font-weight: 600; }
.payment-settings__provider:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
.payment-settings__status { display: inline-flex; gap: var(--ui-space-2); align-items: center; font-size: 14px; white-space: nowrap; }
.payment-settings__rates { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr)); gap: 1rem 1.5rem; }
.payment-settings__rate { display: flex; gap: 0.75rem; align-items: center; justify-content: space-between; min-width: 0; }
.payment-settings__rate :deep(.p-inputnumber) { min-width: 0; max-width: 12rem; flex: 1; }
.payment-settings__rate :deep(input) { width: 100%; }
.payment-settings__add-rate { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
.payment-settings__add-rate :deep(input) { max-width: 6rem; }
.payment-settings .field > label { display: block; margin-bottom: 0.5rem; }
.payment-settings .field small { display: block; margin-top: 0.5rem; }
</style>

<template>
  <div class="punishments-grid">
    <form class="punishments-panel punishments-form" @submit.prevent="saveDefaults">
      <h2>{{ $t('punishments.game_sale') }}</h2>
      <p>{{ $t('punishments.game_sale_hint') }}</p>
      <label class="flex align-items-center gap-2"><ToggleSwitch v-model="defaults.gameUnbanEnabled" />{{ $t('punishments.sale_enabled') }}</label>
      <label class="punishments-field"><span>{{ $t('punishments.default_price') }}</span><InputNumber v-model="defaults.gameUnbanPrice" :min="0" :max="1000000000" :maxFractionDigits="2" /></label>
      <Button type="submit" :loading="busy" :label="$t('common.save')" />
    </form>
    <form class="punishments-panel punishments-form" @submit.prevent="saveServer">
      <h2>{{ $t('punishments.server_rule') }}</h2>
      <label class="punishments-field"><span>{{ $t('punishments.scope') }}</span><Select v-model="serverId" :options="state.options.value.servers" optionLabel="name" optionValue="id" @change="selectServer" /></label>
      <label class="punishments-field"><span>{{ $t('punishments.sale_enabled') }}</span><Select v-model="serverRule.enabled" :options="saleOptions" optionLabel="label" optionValue="value" /></label>
      <label class="punishments-field"><span>{{ $t('punishments.price_override') }}</span><InputNumber v-model="serverRule.price" :min="0" :max="1000000000" :maxFractionDigits="2" /></label>
      <Button type="submit" :loading="busy" :disabled="!serverId" :label="$t('common.save')" />
    </form>
  </div>
  <Message v-if="failure" severity="error" :closable="false">{{ failure }}</Message>
  <p>{{ $t('punishments.account_sale_hint') }} <NuxtLink to="/config">{{ $t('admin.menu_settings') }}</NuxtLink></p>
</template>

<script setup lang="ts">
const { state } = defineProps<{ state: ReturnType<typeof usePunishmentAdmin> }>()
const { $t } = useNuxtApp()
const defaults = reactive({ gameUnbanEnabled: Boolean(state.options.value.settings?.gameUnbanEnabled), gameUnbanPrice: state.options.value.settings?.gameUnbanPrice ?? 150 })
const serverId = ref(''), serverRule = ref<any>({ enabled: null, price: null }), busy = ref(false), failure = ref('')
const saleOptions = computed(() => [{ value: null, label: $t('punishments.inherit') }, { value: true, label: $t('admin.yes') }, { value: false, label: $t('admin.no') }])
function selectServer() { serverRule.value = { ...(state.options.value.settings?.servers?.[serverId.value] || { enabled: null, price: null }) } }
async function save(path: string, body: any) {
  if (busy.value) return
  busy.value = true
  try { await state.action('put', path, body); failure.value = '' } catch { failure.value = state.error.value } finally { busy.value = false }
}
function saveDefaults() { return save('/settings', defaults) }
function saveServer() { return save('/settings/server', { serverId: serverId.value, ...serverRule.value }) }
</script>

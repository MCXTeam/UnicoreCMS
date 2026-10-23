<template>
  <div class="punishments-toolbar"><Button v-for="value in ['active','history']" :key="value" :outlined="tab !== value" :aria-pressed="tab === value" :label="$t(`punishments.${value}`)" @click="tab = value; page = 1; load()" /><Button :label="$t('admin.refresh')" icon="pi pi-refresh" :loading="loading" @click="load" /></div>
  <p>{{ $t('punishments.purchase_admin_hint') }}</p>
  <Message v-if="failure" severity="error" :closable="false">{{ failure }}</Message>
  <DataTable :value="rows" dataKey="id" lazy paginator :rows="25" :totalRecords="total" :first="(page - 1) * 25" @page="page = $event.page + 1; load()" :loading="loading" :tableStyle="{ minWidth: '42rem' }">
    <Column :header="$t('common.date')"><template #body="{ data }">{{ $moment(data.createdAt).format('DD.MM.YYYY, HH:mm') }}</template></Column>
    <Column :header="$t('players.player')"><template #body="{ data }">{{ data.buyerName || data.buyerUuid }}</template></Column>
    <Column :header="$t('players.reason')"><template #body="{ data }">{{ data.snapshot.reason }}</template></Column>
    <Column :header="$t('admin.amount')"><template #body="{ data }">{{ $utils.formatCurrency('real', data.amount) }}</template></Column>
    <Column :header="$t('punishments.status')"><template #body="{ data }">{{ $t(`punishments.purchase_${data.status}`) }}<p>{{ data.resolution }}</p></template></Column>
    <Column><template #body="{ data }"><Button v-if="['RESERVED','REVIEW'].includes(data.status)" text :label="$t('punishments.refund')" @click="selected = data; reason = ''" /></template></Column>
    <template #empty>{{ $t('common.no_results') }}</template>
  </DataTable>
  <Dialog class="punishments-dialog" :visible="Boolean(selected)" modal :header="$t('punishments.refund')" :style="{ width: 'min(32rem, calc(100vw - 2rem))' }" :closable="!busy" @update:visible="selected = null">
    <form id="punishment-refund" class="punishments-form" @submit.prevent="refund">
      <p>{{ $t('punishments.refund_hint') }}</p>
      <label class="punishments-field"><span>{{ $t('punishments.resolution_reason') }}</span><Textarea v-model="reason" rows="4" required maxlength="4096" /></label>
      <Message v-if="failure" severity="error" :closable="false">{{ failure }}</Message>
    </form>
    <template #footer><Button text :label="$t('common.cancel')" :disabled="busy" @click="selected = null" /><Button type="submit" form="punishment-refund" :label="$t('punishments.refund')" :loading="busy" :disabled="!reason.trim()" /></template>
  </Dialog>
</template>

<script setup lang="ts">
const { state } = defineProps<{ state: ReturnType<typeof usePunishmentAdmin> }>()
const { $t } = useNuxtApp()
const rows = ref<any[]>([]), loading = ref(false), failure = ref(''), selected = ref<any>(null), reason = ref(''), busy = ref(false)
const tab = ref('active'), page = ref(1), total = ref(0)
let timer: ReturnType<typeof setTimeout> | undefined
let mounted = false
let generation = 0
async function load() {
  if (!mounted || document.visibilityState === 'hidden') return
  const current = ++generation
  clearTimeout(timer)
  loading.value = true
  try { const data = await state.api('get', `/purchases?tab=${tab.value}&page=${page.value}`); if (mounted && current === generation) { rows.value = data.data; total.value = data.meta.totalItems; failure.value = '' } }
  catch { if (mounted && current === generation) failure.value = $t('punishments.load_error') }
  finally { if (mounted && current === generation) { loading.value = false; timer = setTimeout(load, 5000) } }
}
onMounted(() => { mounted = true; void load() })
onBeforeUnmount(() => { mounted = false; generation++; clearTimeout(timer) })
async function refund() {
  if (busy.value || !selected.value) return
  busy.value = true
  try { await state.action('post', `/purchases/${selected.value.id}/resolve`, { action: 'REFUND', reason: reason.value }); selected.value = null; await load() }
  catch { failure.value = state.error.value } finally { busy.value = false }
}
</script>

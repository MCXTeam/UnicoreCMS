<template>
  <div class="punishments-toolbar">
    <Button v-for="tab in ['active', 'history']" :key="tab" :outlined="state.filters.tab !== tab" :aria-pressed="state.filters.tab === tab" @click="state.filters.tab = tab; state.filters.page = 1">{{ $t(`punishments.${tab}`) }} ({{ state.result.value.counters[tab] }})</Button>
    <InputText v-model="search" :placeholder="$t('punishments.search')" :aria-label="$t('punishments.search')" @keydown.enter="state.filters.search = search; state.filters.page = 1" />
    <Select v-model="state.filters.category" :options="categories" optionLabel="label" optionValue="value" :aria-label="$t('punishments.category')" @change="state.filters.page = 1" />
    <Select v-model="scope" :options="scopeOptions" optionLabel="label" :placeholder="$t('punishments.scope')" :aria-label="$t('punishments.scope')" showClear @change="filterScope" />
    <Button v-if="state.options.value.scopes.some((area: any) => area.issue)" :label="$t('punishments.issue')" icon="pi pi-plus" @click="issuing = true" />
  </div>
  <Message v-if="state.filters.subjectUuid" severity="info" :closable="false">{{ $t('punishments.player_filter') }}: {{ state.filters.subjectUuid }} <Button text :label="$t('punishments.clear_filter')" @click="state.filters.subjectUuid = ''" /></Message>
  <DataTable :value="state.result.value.data" dataKey="id" :loading="state.loading.value" lazy paginator :rows="25" :totalRecords="state.result.value.meta.totalItems" :first="(state.filters.page - 1) * 25" @page="state.filters.page = $event.page + 1" :tableStyle="{ minWidth: '42rem' }">
    <Column :header="$t('players.player')"><template #body="{ data }">{{ data.user?.username || data.subjectUuid }}</template></Column>
    <Column :header="$t('punishments.category')"><template #body="{ data }">{{ $t(data.category === 'ACCOUNT' ? 'punishments.account' : `cabinet.punishment_kind_${data.kind}`) }}</template></Column>
    <Column :header="$t('punishments.scope')"><template #body="{ data }">{{ state.scopeLabel(data.scope) }}</template></Column>
    <Column :header="$t('players.reason')"><template #body="{ data }"><span class="punishments-reason">{{ data.reason }}</span></template></Column>
    <Column :header="$t('punishments.status')"><template #body="{ data }"><Tag :value="$t(`cabinet.punishment_status_${data.status}`)" :severity="data.status === 'ACTIVE' ? 'warn' : 'secondary'" /><p v-if="data.desired === 'REVOKED' && data.status === 'ACTIVE'">{{ $t('punishments.removal_pending') }}</p></template></Column>
    <Column :header="$t('players.unban_date')"><template #body="{ data }">{{ data.expires ? $moment(data.expires).format('DD.MM.YYYY, HH:mm') : $t('players.never') }}</template></Column>
    <Column><template #body="{ data }"><Button text :label="$t('punishments.details')" @click="state.selected.value = data" /></template></Column>
    <template #empty>{{ $t('common.no_results') }}</template>
  </DataTable>
  <PunishmentsCaseDialog v-if="state.selected.value" :key="state.selected.value.id" :state="state" @close="state.selected.value = null" />
  <PunishmentsIssueDialog v-if="issuing" :state="state" @close="issuing = false" />
</template>

<script setup lang="ts">
const { state } = defineProps<{ state: ReturnType<typeof usePunishmentAdmin> }>()
const { $t } = useNuxtApp()
const search = ref(state.filters.search)
const scope = ref<any>(null)
const issuing = ref(false)
const categories = computed(() => [{ value: '', label: $t('punishments.all_categories') }, { value: 'GAME', label: $t('punishments.game') }, { value: 'ACCOUNT', label: $t('punishments.account') }])
const scopeOptions = computed(() => state.options.value.scopes.filter((area: any) => area.read).map((area: any) => ({ ...area, label: state.scopeLabel(area) })))
function filterScope() { state.filters.scopeType = scope.value?.type || ''; state.filters.scopeId = scope.value?.id || ''; state.filters.page = 1 }
</script>

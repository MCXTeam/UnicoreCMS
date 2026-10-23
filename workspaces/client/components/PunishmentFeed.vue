<template>
  <section class="punishment-feed" :aria-label="$t('punishments.title')" :aria-busy="loading">
    <div class="punishment-feed__controls">
      <div class="punishment-feed__tabs" role="group" :aria-label="$t('punishments.status')">
        <Button v-for="value in tabs" :key="value" size="small" :outlined="tab !== value" :aria-pressed="tab === value" @click="tab = value">{{ $t(`punishments.${value}`) }} ({{ result.counters[value] }})</Button>
      </div>
      <Select v-model="category" :options="categories" optionLabel="label" optionValue="value" :aria-label="$t('punishments.category')" />
      <form v-if="!own && !username" class="punishment-feed__search" @submit.prevent="reset">
        <InputText v-model="search" :placeholder="$t('punishments.search')" :aria-label="$t('punishments.search')" />
        <Button type="submit" icon="pi pi-search" :aria-label="$t('punishments.search')" />
      </form>
    </div>
    <Message v-if="error" severity="error" :closable="false">{{ $t('punishments.load_error') }} <Button text size="small" :label="$t('admin.retry')" @click="refresh" /></Message>
    <p v-if="own && result.reservedBalance" class="punishment-feed__reserve" role="status">{{ $t('punishments.reserved', { amount: $utils.formatCurrency('real', result.reservedBalance) }) }}</p>
    <Skeleton v-if="loading && !result.data.length && !error" height="100px" />
    <p v-else-if="!result.data.length && !error" class="cab-sub">{{ $t(tab === 'active' ? 'punishments.empty_active' : 'punishments.empty_history') }}</p>
    <div class="punishment-feed__list">
      <article v-for="item in result.data" :key="item.id" class="punishment-feed__item">
        <div class="punishment-feed__heading">
          <div>
            <NuxtLink v-if="!own && !username && item.user" :to="`/user/${item.user.username}`" class="punishment-feed__player">{{ item.user.username }}</NuxtLink>
            <span v-else-if="!own && !username" class="punishment-feed__player">{{ item.subjectUuid }}</span>
            <b>{{ $t(item.category === 'ACCOUNT' ? 'punishments.account' : `cabinet.punishment_kind_${item.kind}`) }}</b>
          </div>
          <Tag :severity="item.status === 'ACTIVE' ? 'warn' : 'secondary'" :value="$t(`cabinet.punishment_status_${item.status}`)" />
        </div>
        <p class="punishment-feed__scope">{{ scopeLabel(item) }}</p>
        <p class="punishment-feed__reason">{{ item.reason }}</p>
        <dl class="punishment-feed__details">
          <div><dt>{{ $t('players.ban_date') }}</dt><dd>{{ $moment(item.created).format('DD.MM.YYYY, HH:mm') }}</dd></div>
          <div><dt>{{ $t('players.unban_date') }}</dt><dd>{{ item.expires ? $moment(item.expires).format('DD.MM.YYYY, HH:mm') : $t('players.never') }}</dd></div>
          <div><dt>{{ $t('players.moderator') }}</dt><dd><NuxtLink v-if="item.actor" :to="`/user/${item.actor.username}`">{{ item.actor.username }}</NuxtLink><span v-else>{{ item.actorName || $t('players.console') }}</span></dd></div>
        </dl>
        <p v-if="item.status === 'ACTIVE' && item.desired === 'REVOKED'" class="cab-sub" role="status">{{ $t('punishments.removal_pending') }}</p>
        <div v-if="own" class="punishment-feed__purchase">
          <p v-if="item.purchase" role="status">{{ $t(`punishments.purchase_${item.purchase.status}`) }}<span v-if="item.purchase.resolution">: {{ item.purchase.resolution }}</span></p>
          <Button v-if="item.quote?.available" outlined :label="$t('cabinet.buy_unban', { price: $utils.formatCurrency('real', item.quote.price ?? 0) })" @click="selected = item" />
          <p v-else-if="item.status === 'ACTIVE' && item.desired === 'ACTIVE' && item.quote?.reason" class="cab-sub">{{ item.quote.reason }}</p>
        </div>
      </article>
    </div>
    <Paginator v-if="result.meta.totalItems > result.meta.itemsPerPage" :rows="result.meta.itemsPerPage" :totalRecords="result.meta.totalItems" :first="(page - 1) * result.meta.itemsPerPage" @page="page = $event.page + 1" />
    <Dialog :visible="Boolean(selected)" modal :header="$t('punishments.purchase_title')" :style="{ width: 'min(32rem, calc(100vw - 2rem))' }" :closable="!buying" @update:visible="!buying && (selected = null)">
      <template v-if="selected">
        <p class="punishment-feed__reason"><b>{{ scopeLabel(selected) }}</b></p>
        <p class="punishment-feed__reason">{{ selected.reason }}</p>
        <p>{{ $t(selected.category === 'GAME' ? 'punishments.purchase_reserve_hint' : 'punishments.purchase_account_hint') }}</p>
        <Message v-if="buyError" severity="error" :closable="false">{{ buyError }}</Message>
      </template>
      <template #footer>
        <Button text :disabled="buying" :label="$t('common.cancel')" @click="selected = null" />
        <Button :loading="buying" :disabled="!selected?.quote?.available" :label="$t('punishments.purchase_confirm', { amount: $utils.formatCurrency('real', selected?.quote?.price || 0) })" @click="buy" />
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import type { PunishmentView } from 'unicore-common'
const props = defineProps<{ own?: boolean; username?: string }>()
const { $t, $auth } = useNuxtApp() as any
const api = useApi()
const { result, loading, error, tab, category, search, page, refresh, reset } = usePunishments(() => ({ own: props.own, username: props.username }))
const tabs = ['active', 'history'] as const
const categories = computed(() => [{ value: '', label: $t('punishments.all_categories') }, { value: 'GAME', label: $t('punishments.game') }, { value: 'ACCOUNT', label: $t('punishments.account') }])
const selected = ref<PunishmentView | null>(null)
const buying = ref(false)
const buyError = ref('')
const requestIds = new Map<string, string>()
const scopeLabel = (item: PunishmentView) => item.scope.nativeNetworkId ? $t('punishments.native_network', { provider: item.scope.providerId, scope: item.scope.nativeNetworkId === '*' ? $t('punishments.native_network_all') : item.scope.nativeNetworkId }) : item.scope.name ? `${$t(`punishments.scope_${item.scope.type}`)}: ${item.scope.name}` : $t(item.category === 'ACCOUNT' ? 'punishments.account_scope' : 'punishments.project_scope')
watch(selected, () => { buyError.value = '' })

async function buy() {
  const item = selected.value
  if (!item || buying.value) return
  const key = `${item.id}:${item.revision}:${item.quote?.price}`
  const requestId = requestIds.get(key) || crypto.randomUUID()
  requestIds.set(key, requestId)
  buying.value = true
  buyError.value = ''
  try {
    await api.post(`/cabinet/punishments/${item.id}/purchase`, { requestId, revision: item.revision, quotedPrice: item.quote?.price })
    selected.value = null
    await Promise.allSettled([refresh(), $auth.fetchUser()])
  } catch (failure: any) {
    await refresh()
    if (result.value.purchases?.some((purchase) => purchase.caseId === item.id && ['RESERVED','REVIEW','COMPLETED'].includes(purchase.status))) {
      selected.value = null
      await $auth.fetchUser().catch(() => {})
      return
    }
    const latest = result.value.data.find((entry) => entry.id === item.id)
    if (latest) selected.value = latest
    await nextTick()
    buyError.value = typeof failure.response?.data?.message === 'string' ? failure.response.data.message : $t('punishments.purchase_error')
  } finally { buying.value = false }
}
</script>

<style scoped>
.punishment-feed { min-width: 0; }
.punishment-feed__controls, .punishment-feed__tabs, .punishment-feed__search { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.punishment-feed__controls { margin-bottom: 1rem; }
.punishment-feed__search { flex: 1; }
.punishment-feed__search input { flex: 1; min-width: 8rem; width: 0; }
.punishment-feed__list { display: grid; gap: 1rem; }
.punishment-feed__item { min-width: 0; border: 1px solid var(--p-content-border-color); border-radius: var(--p-content-border-radius); padding: 1rem; }
.punishment-feed__heading { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; }
.punishment-feed__heading > div { min-width: 0; overflow-wrap: anywhere; }
.punishment-feed__player { display: block; margin-bottom: .25rem; font-weight: 600; }
.punishment-feed__scope { margin: .5rem 0; color: var(--p-text-muted-color); overflow-wrap: anywhere; }
.punishment-feed__reason { white-space: pre-wrap; overflow-wrap: anywhere; }
.punishment-feed__details { display: flex; flex-wrap: wrap; gap: .75rem 2rem; margin: 1rem 0 0; }
.punishment-feed__details > div { min-width: 0; }
.punishment-feed__details dt { font-weight: 400; color: var(--p-text-muted-color); font-size: .85rem; }
.punishment-feed__details dd { margin: .2rem 0 0; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
.punishment-feed__purchase { margin-top: 1rem; }
.punishment-feed__purchase > p:last-child { margin-bottom: 0; }
.punishment-feed__purchase :deep(button) { max-width: 100%; white-space: normal; }
.punishment-feed__reserve { font-variant-numeric: tabular-nums; }
@media (max-width: 480px) { .punishment-feed__controls > :deep(.p-select) { width: 100%; } .punishment-feed__heading { flex-wrap: wrap; } }
</style>

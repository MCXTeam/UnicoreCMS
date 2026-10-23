<template>
  <Dialog class="punishments-dialog" visible modal :header="$t('punishments.details')" :style="{ width: 'min(58rem, calc(100vw - 2rem))' }" :closable="!busy" @update:visible="$emit('close')">
    <p><b>{{ item.user?.username || item.subjectUuid }}</b> · {{ state.scopeLabel(item.scope) }}</p>
    <p class="punishments-reason">{{ item.reason }}</p>
    <Message v-if="failure" severity="error" :closable="false">{{ failure }}</Message>
    <div class="punishments-toolbar">
      <Button v-if="item.allowedActions?.revoke && item.status === 'ACTIVE' && item.desired === 'ACTIVE'" severity="danger" outlined :label="$t('punishments.revoke')" :disabled="busy" @click="confirming = true" />
      <Button v-if="item.allowedActions?.sale && item.status === 'ACTIVE'" outlined :label="$t(item.saleBlocked ? 'punishments.allow_purchase' : 'punishments.block_purchase')" :disabled="busy" @click="saleOpen = !saleOpen" />
    </div>
    <div v-if="confirming" class="punishments-panel mb-3">
      <p>{{ $t('punishments.revoke_confirm', { scope: state.scopeLabel(item.scope) }) }}</p>
      <Button severity="danger" :loading="busy" :label="$t('punishments.revoke')" @click="run('post', `/cases/${item.id}/revoke`, { revision: item.revision })" />
      <Button text :label="$t('common.cancel')" @click="confirming = false" />
    </div>
    <form v-if="saleOpen" class="punishments-form mb-3" @submit.prevent="run('patch', `/cases/${item.id}/sale`, { revision: item.revision, blocked: !item.saleBlocked, reason: saleReason })">
      <label v-if="!item.saleBlocked" class="punishments-field"><span>{{ $t('punishments.purchase_block_reason') }}</span><Textarea v-model="saleReason" required maxlength="4096" /></label>
      <Button type="submit" :loading="busy" :label="$t('common.save')" />
    </form>
    <h2>{{ $t('punishments.delivery') }}</h2>
    <DataTable :value="details?.bindings || []" dataKey="id" :tableStyle="{ minWidth: '32rem' }">
      <Column :header="$t('punishments.instances')"><template #body="{ data }">{{ instanceName(data.streamId) }} · {{ data.providerId }}</template></Column>
      <Column :header="$t('punishments.status')"><template #body="{ data }">{{ $t(`punishments.delivery_${data.status}`) }}<p v-if="data.detail">{{ data.detail }}</p></template></Column>
      <Column><template #body="{ data }">
        <Button v-if="canDeliver && ['FAILED','UNSUPPORTED','CONFLICT'].includes(data.status)" text :label="$t('admin.retry')" :disabled="busy" @click="run('post', `/cases/${item.id}/retry`, { bindingId: data.id })" />
        <Button v-if="canDeliver && data.status === 'UNKNOWN' && !data.revokeCommandId" text :label="$t('punishments.verify')" @click="verification = data; externalId = ''; verificationReason = ''" />
      </template></Column>
    </DataTable>
    <form v-if="verification" class="punishments-form mt-3" @submit.prevent="run('post', `/cases/${item.id}/verify`, { bindingId: verification.id, externalId, reason: verificationReason })">
      <p>{{ $t('punishments.verify_hint') }}</p>
      <label class="punishments-field"><span>{{ $t('punishments.external_id') }}</span><InputText v-model="externalId" required maxlength="256" /></label>
      <label class="punishments-field"><span>{{ $t('punishments.resolution_reason') }}</span><Textarea v-model="verificationReason" required maxlength="4096" /></label>
      <Button type="submit" :loading="busy" :label="$t('punishments.verify')" />
    </form>
    <template v-if="item.status === 'ACTIVE' && item.desired === 'ACTIVE' && (item.allowedActions?.transfer || item.category === 'ACCOUNT' && item.allowedActions?.revoke)">
      <h2>{{ $t('punishments.transfer') }}</h2>
      <p>{{ $t(item.category === 'ACCOUNT' ? 'punishments.convert_hint' : 'punishments.transfer_hint') }}</p>
      <div class="punishments-toolbar">
        <Select v-model="destination" :options="destinations" optionLabel="label" :placeholder="$t('punishments.scope')" :aria-label="$t('punishments.scope')" @change="preview = null" />
        <Select v-if="destination?.type === 'INSTANCE'" v-model="conversionProvider" :options="conversionProviders" optionLabel="providerId" optionValue="providerId" :placeholder="$t('punishments.provider')" :aria-label="$t('punishments.provider')" @change="preview = null" />
        <Button :disabled="!destination || busy" outlined :label="$t('punishments.preview')" @click="transfer(false)" />
      </div>
      <div v-if="preview" class="punishments-panel">
        <p>{{ $t('punishments.preview_target', { scope: destination.label }) }}</p>
        <p v-for="(member, index) in preview.add || preview.servers || []" :key="`add-${index}`">+ {{ instanceName(member.streamId) }} · {{ member.providerId }}</p>
        <p v-for="(member, index) in preview.remove || []" :key="`remove-${index}`">− {{ instanceName(member.streamId) }} · {{ member.providerId }}</p>
        <Button :label="$t('punishments.confirm_transfer')" :loading="busy" @click="transfer(true)" />
      </div>
    </template>
    <h2>{{ $t('punishments.audit') }}</h2>
    <DataTable :value="details?.audit || []" :tableStyle="{ minWidth: '28rem' }">
      <Column :header="$t('common.date')"><template #body="{ data }">{{ $moment(data.createdAt).format('DD.MM.YYYY, HH:mm:ss') }}</template></Column>
      <Column :header="$t('punishments.action')"><template #body="{ data }">{{ $t(`punishments.audit_${data.action.replaceAll('.', '_')}`) }}<p v-if="data.detail?.reason" class="punishments-reason">{{ data.detail.reason }}</p></template></Column>
      <Column field="actorUuid" :header="$t('players.moderator')" />
    </DataTable>
  </Dialog>
</template>

<script setup lang="ts">
const { state } = defineProps<{ state: ReturnType<typeof usePunishmentAdmin> }>()
const emit = defineEmits(['close'])
const { $t } = useNuxtApp()
const item = computed(() => state.selected.value!)
const details = ref<any>(null), failure = ref(''), busy = ref(false)
const confirming = ref(false), saleOpen = ref(false), saleReason = ref('')
const verification = ref<any>(null), externalId = ref(''), verificationReason = ref('')
const destination = ref<any>(null), preview = ref<any>(null)
const conversionProvider = ref('')
const conversionId = crypto.randomUUID()
const canDeliver = computed(() => item.value.desired === 'ACTIVE' ? item.value.allowedActions?.transfer : item.value.allowedActions?.revoke)
const destinations = computed(() => state.options.value.scopes.filter((scope: any) => scope.issue && scope.issueKinds?.includes(item.value.kind) && (item.value.category === 'ACCOUNT' || scope.type === 'GROUP')).map((scope: any) => ({ ...scope, label: state.scopeLabel(scope) })))
const conversionProviders = computed(() => state.options.value.providers.filter((provider: any) => provider.streamId === destination.value?.id && provider.capabilities.issueKinds.includes('BAN')))
watch(destination, () => { conversionProvider.value = ''; preview.value = null })
const instanceName = (id: string) => { const row = state.options.value.instances.find((instance: any) => instance.id === id); return row?.displayName || `${state.options.value.servers.find((server: any) => server.id === row?.serverId)?.name || row?.serverId || id} · ${row?.instanceId?.slice(0,8) || ''}` }
async function load() { try { details.value = await state.api('get', `/cases/${item.value.id}`) } catch { failure.value = $t('punishments.load_error') } }
onMounted(load)
async function run(method: string, path: string, body: any) {
  if (busy.value) return
  busy.value = true; failure.value = ''
  try { await state.action(method, path, body); emit('close') } catch { failure.value = state.error.value } finally { busy.value = false }
}
async function transfer(confirm: boolean) {
  if (busy.value || !destination.value) return
  busy.value = true; failure.value = ''
  try {
    const account = item.value.category === 'ACCOUNT'
    const body = account ? { requestId: conversionId, subjectUuid: item.value.subjectUuid, kind: 'BAN', reason: item.value.reason, scopeType: destination.value.type, scopeId: destination.value.id || undefined, providerId: destination.value.type === 'INSTANCE' ? conversionProvider.value || undefined : undefined, revision: item.value.revision, confirm, previewToken: confirm ? preview.value?.previewToken : undefined } : { revision: item.value.revision, groupId: destination.value.id, groupRevision: preview.value?.groupRevision, confirm }
    const response = await state.action('post', `/cases/${item.value.id}/${account ? 'convert-account' : 'transfer'}`, body)
    if (confirm) emit('close'); else preview.value = response.preview
  } catch { preview.value = null; failure.value = state.error.value } finally { busy.value = false }
}
</script>

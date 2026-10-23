<template>
  <Dialog class="punishments-dialog" visible modal :header="$t('punishments.issue')" :style="{ width: 'min(34rem, calc(100vw - 2rem))' }" :closable="!busy" @update:visible="$emit('close')">
    <form id="punishment-issue" class="punishments-form" @submit.prevent="save">
      <label class="punishments-field"><span>{{ $t('players.player') }}</span><AutoComplete v-model="player" :suggestions="candidates" optionLabel="username" forceSelection @complete="lookup" /></label>
      <label class="punishments-field"><span>{{ $t('punishments.scope') }}</span><Select v-model="scope" :options="scopes" optionLabel="label" /></label>
      <label class="punishments-field"><span>{{ $t('punishments.kind') }}</span><Select v-model="form.kind" :options="kinds" optionLabel="label" optionValue="value" /></label>
      <label v-if="scope?.type === 'INSTANCE'" class="punishments-field"><span>{{ $t('punishments.provider') }}</span><Select v-model="form.providerId" :options="providers" optionLabel="providerId" optionValue="providerId" /></label>
      <label class="punishments-field"><span>{{ $t('players.reason') }}</span><Textarea v-model="form.reason" required :maxlength="4096" rows="3" /></label>
      <label class="punishments-field"><span>{{ $t('punishments.until_hint') }}</span><InputText v-model="until" type="datetime-local" :disabled="!timed" :required="!permanent" /></label>
      <p v-if="scope && !timed">{{ $t('punishments.permanent_only') }}</p>
      <Message v-if="failure" severity="error" :closable="false">{{ failure }}</Message>
    </form>
    <template #footer><Button text :label="$t('common.cancel')" :disabled="busy" @click="$emit('close')" /><Button type="submit" form="punishment-issue" :label="$t('punishments.issue')" :loading="busy" :disabled="!player?.uuid || !scope || !form.reason.trim() || scope.type === 'INSTANCE' && providers.length > 1 && !form.providerId" /></template>
  </Dialog>
</template>

<script setup lang="ts">
const { state } = defineProps<{ state: ReturnType<typeof usePunishmentAdmin> }>()
const emit = defineEmits(['close'])
const { $t } = useNuxtApp()
const player = ref<any>(null), candidates = ref<any[]>([]), scope = ref<any>(null)
const until = ref(''), busy = ref(false), failure = ref('')
const form = reactive({ requestId: crypto.randomUUID(), kind: 'BAN', reason: '', providerId: '' })
const scopes = computed(() => state.options.value.scopes.filter((area: any) => area.issue).map((area: any) => ({ ...area, label: state.scopeLabel(area) })))
const kinds = computed(() => (scope.value?.issueKinds || []).map((value: string) => ({ value, label: $t(`cabinet.punishment_kind_${value}`) })))
const providers = computed(() => state.options.value.providers.filter((provider: any) => provider.streamId === scope.value?.id && provider.mode === 'bidirectional' && provider.capabilities.issueKinds.includes(form.kind) && provider.capabilities.revokeKinds.includes(form.kind)))
const selectedProvider = computed(() => providers.value.find((provider: any) => provider.providerId === form.providerId) || (providers.value.length === 1 ? providers.value[0] : null))
const timed = computed(() => selectedProvider.value ? (selectedProvider.value.capabilities.timedKinds || selectedProvider.value.capabilities.issueKinds).includes(form.kind) : scope.value?.timedKinds?.includes(form.kind))
const permanent = computed(() => selectedProvider.value ? (selectedProvider.value.capabilities.permanentKinds || selectedProvider.value.capabilities.issueKinds).includes(form.kind) : scope.value?.permanentKinds?.includes(form.kind))
watch(kinds, () => { if (!kinds.value.some((kind: any) => kind.value === form.kind)) form.kind = kinds.value[0]?.value || 'BAN' })
watch(timed, (enabled) => { if (!enabled) until.value = '' })
watch(scope, () => { form.providerId = '' })
async function lookup(event: any) { candidates.value = await state.api('get', `/players?search=${encodeURIComponent(event.query)}`).catch(() => []) }
async function save() {
  if (busy.value || !player.value?.uuid || !scope.value) return
  busy.value = true
  try {
    await state.action('post', '/issue', { ...form, providerId: form.providerId || undefined, subjectUuid: player.value.uuid, scopeType: scope.value.type, scopeId: scope.value.id || undefined, expiresAtMs: until.value ? new Date(until.value).getTime() : undefined })
    emit('close')
  } catch { failure.value = state.error.value } finally { busy.value = false }
}
</script>

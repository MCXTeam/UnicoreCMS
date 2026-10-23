<template>
  <p>{{ $t('punishments.instances_hint') }}</p>
  <Message v-if="failure" severity="error" :closable="false">{{ failure }}</Message>
  <div class="punishments-grid">
    <article v-for="instance in state.options.value.instances" :key="instance.id" class="punishments-panel">
      <h2>{{ instance.displayName || serverName(instance.serverId) }}</h2>
      <p class="punishments-reason">{{ instance.instanceId }}</p>
      <Tag v-if="instance.retired" severity="secondary" :value="$t('punishments.retired')" />
      <div v-for="provider in state.options.value.providers.filter((row: any) => row.streamId === instance.id)" :key="provider.id">
        <p><b>{{ provider.providerId }}</b> {{ provider.version }} · {{ $t(`punishments.mode_${provider.mode}`) }}</p>
        <p>{{ $t('punishments.can_issue') }}: {{ provider.capabilities.issueKinds.map(kindLabel).join(', ') || $t('admin.no') }}</p>
        <p>{{ $t('punishments.can_revoke') }}: {{ provider.capabilities.revokeKinds.map(kindLabel).join(', ') || $t('admin.no') }}</p>
      </div>
      <Button v-if="instance.canEdit" outlined :label="$t('admin.edit')" @click="selected = instance; form = { displayName: instance.displayName || '', serverInstanceId: instance.serverInstanceId || null }" />
    </article>
  </div>
  <Dialog class="punishments-dialog" :visible="Boolean(selected)" modal :header="$t('punishments.instance_settings')" :style="{ width: 'min(34rem, calc(100vw - 2rem))' }" :closable="!busy" @update:visible="selected = null">
    <form id="punishment-instance" class="punishments-form" @submit.prevent="save">
      <label class="punishments-field"><span>{{ $t('admin.name') }}</span><InputText v-model="form.displayName" maxlength="128" /></label>
      <label class="punishments-field"><span>{{ $t('punishments.server_address') }}</span><Select v-model="form.serverInstanceId" :options="addresses" optionLabel="label" optionValue="id" showClear /></label>
      <Message v-if="failure" severity="error" :closable="false">{{ failure }}</Message>
    </form>
    <template #footer><Button text :label="$t('common.cancel')" :disabled="busy" @click="selected = null" /><Button type="submit" form="punishment-instance" :label="$t('common.save')" :loading="busy" /></template>
  </Dialog>
</template>

<script setup lang="ts">
const { state } = defineProps<{ state: ReturnType<typeof usePunishmentAdmin> }>()
const { $t } = useNuxtApp()
const selected = ref<any>(null), form = ref<any>({}), busy = ref(false), failure = ref('')
const kindLabel = (kind: string) => $t(`cabinet.punishment_kind_${kind}`)
const serverName = (id: string) => state.options.value.servers.find((row: any) => row.id === id)?.name || id
const addresses = computed(() => state.options.value.serverInstances.filter((row: any) => row.serverId === selected.value?.serverId).map((row: any) => ({ ...row, label: `${row.name || ''} ${row.host}:${row.port}`.trim() })))
async function save() {
  if (busy.value || !selected.value) return
  busy.value = true
  try { await state.action('patch', `/instances/${selected.value.id}`, form.value); selected.value = null }
  catch { failure.value = state.error.value } finally { busy.value = false }
}
</script>

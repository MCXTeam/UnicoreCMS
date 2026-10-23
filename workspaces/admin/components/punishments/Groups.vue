<template>
  <div class="punishments-toolbar"><Button :label="$t('punishments.create_group')" icon="pi pi-plus" @click="edit()" /></div>
  <p>{{ $t('punishments.groups_hint') }}</p>
  <div class="punishments-grid">
    <article v-for="group in state.options.value.groups" :key="group.id" class="punishments-panel">
      <h2>{{ group.name }}</h2>
      <p>{{ group.kinds.map(kindLabel).join(', ') }}</p>
      <p>{{ $t('punishments.member_count', { count: group.members.length }) }}</p>
      <p>{{ $t(group.enabled ? 'punishments.auto_on' : 'punishments.auto_off') }}</p>
      <Button outlined :label="$t('admin.edit')" @click="edit(group)" />
    </article>
  </div>
  <Dialog class="punishments-dialog" v-model:visible="visible" modal :header="$t('punishments.group_settings')" :style="{ width: 'min(48rem, calc(100vw - 2rem))' }" :closable="!busy">
    <form id="punishment-group" class="punishments-form" @submit.prevent="save">
      <label class="punishments-field"><span>{{ $t('punishments.group_id') }}</span><InputText v-model="form.id" :disabled="Boolean(form.revision)" required pattern="[a-zA-Z0-9_-]{1,64}" maxlength="64" /></label>
      <label class="punishments-field"><span>{{ $t('admin.name') }}</span><InputText v-model="form.name" required maxlength="128" /></label>
      <label class="punishments-field"><span>{{ $t('punishments.shared_kinds') }}</span><MultiSelect v-model="form.kinds" :options="kinds" optionLabel="label" optionValue="value" /></label>
      <label class="flex align-items-center gap-2"><ToggleSwitch v-model="form.enabled" />{{ $t('punishments.auto_share') }}</label>
      <label class="punishments-field"><span>{{ $t('punishments.members') }}</span><MultiSelect v-model="memberKeys" :options="members" optionLabel="label" optionValue="key" filter :maxSelectedLabels="1" :selectedItemsLabel="$t('punishments.selected_members', { count: memberKeys.length })" /></label>
      <p>{{ $t('punishments.primary_hint') }}</p>
      <div v-for="key in memberKeys" :key="key" class="punishments-panel">
        <b>{{ members.find((member: any) => member.key === key)?.label || key }}</b>
        <Button type="button" icon="pi pi-times" text size="small" severity="danger" class="ml-2" :aria-label="$t('admin.delete')" @click="memberKeys = memberKeys.filter((member) => member !== key)" />
        <div class="punishments-toolbar mt-3">
          <label v-for="kind in form.kinds" :key="kind" class="flex align-items-center gap-2"><Checkbox :binary="true" :modelValue="primary[key]?.includes(kind)" @update:modelValue="setPrimary(key, kind, $event)" />{{ kindLabel(kind) }}</label>
        </div>
      </div>
      <label class="punishments-field"><span>{{ $t('punishments.sale_enabled') }}</span><Select v-model="form.unban.enabled" :options="saleOptions" optionLabel="label" optionValue="value" /></label>
      <label class="punishments-field"><span>{{ $t('punishments.price_override') }}</span><InputNumber v-model="form.unban.price" :min="0" :max="1000000000" :maxFractionDigits="2" /></label>
      <Message severity="info" :closable="false">{{ $t('punishments.membership_hint') }}</Message>
      <Message v-if="failure" severity="error" :closable="false">{{ failure }}</Message>
      <div v-if="removing" class="punishments-panel">
        <p>{{ $t('punishments.remove_group_hint') }}</p>
        <Button severity="danger" :label="$t('punishments.remove_group')" :loading="busy" @click="remove" />
      </div>
    </form>
    <template #footer><Button v-if="form.revision && !removing" severity="danger" text :disabled="busy" :label="$t('punishments.remove_group')" @click="removing = true" /><Button text :disabled="busy" :label="$t('common.cancel')" @click="visible = false" /><Button type="submit" form="punishment-group" :loading="busy" :label="$t('common.save')" /></template>
  </Dialog>
</template>

<script setup lang="ts">
const { state } = defineProps<{ state: ReturnType<typeof usePunishmentAdmin> }>()
const { $t } = useNuxtApp()
const visible = ref(false), busy = ref(false), failure = ref('')
const removing = ref(false)
const form = ref<any>({ unban: {} })
const memberKeys = ref<string[]>([])
const primary = ref<Record<string, string[]>>({})
const kindLabel = (kind: string) => $t(`cabinet.punishment_kind_${kind}`)
const kinds = computed(() => ['BAN', 'MUTE', 'WARN', 'KICK', 'JAIL'].map((value) => ({ value, label: kindLabel(value) })))
const saleOptions = computed(() => [{ value: null, label: $t('punishments.inherit') }, { value: true, label: $t('admin.yes') }, { value: false, label: $t('admin.no') }])
const members = computed(() => state.options.value.providers.filter((provider: any) => state.options.value.instances.some((instance: any) => instance.id === provider.streamId && !instance.retired)).map((provider: any) => {
  const instance = state.options.value.instances.find((row: any) => row.id === provider.streamId)
  const server = state.options.value.servers.find((row: any) => row.id === instance.serverId)
  return { key: `${provider.streamId}/${provider.providerId}`, streamId: provider.streamId, providerId: provider.providerId, label: `${instance.displayName || server?.name || instance.serverId} · ${instance.instanceId.slice(0,8)} · ${provider.providerId}` }
}))
function edit(group?: any) {
  form.value = group ? JSON.parse(JSON.stringify(group)) : { id: '', name: '', kinds: ['BAN', 'MUTE'], enabled: true, revision: 0, unban: { enabled: null, price: null } }
  memberKeys.value = (group?.members || []).map((member: any) => `${member.streamId}/${member.providerId}`)
  primary.value = Object.fromEntries((group?.members || []).map((member: any) => [`${member.streamId}/${member.providerId}`, [...member.primaryKinds]]))
  failure.value = ''; visible.value = true
  removing.value = false
}
async function remove() {
  if (busy.value) return
  busy.value = true
  try { await state.action('post', `/groups/${form.value.id}/remove`, { revision: form.value.revision }); visible.value = false }
  catch { failure.value = state.error.value } finally { busy.value = false }
}
function setPrimary(key: string, kind: string, enabled: boolean) { primary.value[key] = enabled ? [...new Set([...(primary.value[key] || []), kind])] : (primary.value[key] || []).filter((value) => value !== kind) }
async function save() {
  if (busy.value) return
  busy.value = true
  try {
    const payload = { ...form.value, members: memberKeys.value.map((key) => { const [streamId, providerId] = key.split('/'); return { streamId, providerId, primaryKinds: (primary.value[key] || []).filter((kind) => form.value.kinds.includes(kind)) } }) }
    await state.action('put', '/groups', payload); visible.value = false
  } catch { failure.value = state.error.value } finally { busy.value = false }
}
</script>

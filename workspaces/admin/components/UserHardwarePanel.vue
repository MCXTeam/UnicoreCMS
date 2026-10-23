<template>
  <section class="hardware-panel" :aria-busy="state.loading.value">
    <div class="hardware-panel__toolbar">
      <p>{{ $t('hardware.description') }}</p>
      <Button :label="$t('hardware.refresh')" icon="pi pi-refresh" outlined :loading="state.loading.value" @click="state.load" />
    </div>
    <Message v-if="state.error.value && !dialog" severity="error" :closable="false">{{ state.error.value }}</Message>
    <p v-if="state.loading.value && !state.devices.value.length" role="status">{{ $t('hardware.loading') }}</p>
    <Message v-else-if="!state.devices.value.length && !state.error.value" severity="info" :closable="false">{{ $t('hardware.empty') }}</Message>
    <Button v-if="bannable.length > 1" :label="$t('hardware.ban_all')" severity="danger" outlined @click="openBan(bannable)" />
    <article v-for="device in state.devices.value" :key="device.id" class="hardware-panel__device">
      <div class="hardware-panel__heading">
        <h3>{{ $t('hardware.device') }} {{ device.id.slice(0, 8) }}</h3>
        <Tag :value="$t(device.activeBan ? 'hardware.blocked' : 'hardware.allowed')" :severity="device.activeBan ? 'danger' : 'success'" />
      </div>
      <dl class="hardware-panel__facts">
        <div><dt>{{ $t('hardware.identifier') }}</dt><dd>{{ device.id }}</dd></div>
        <div><dt>{{ $t('hardware.last_seen') }}</dt><dd>{{ $moment(device.lastSeenAt).format('lll') }}</dd></div>
        <div><dt>{{ $t('hardware.first_seen') }}</dt><dd>{{ $moment(device.firstSeenAt).format('lll') }}</dd></div>
        <div><dt>{{ $t('hardware.memory') }}</dt><dd>{{ device.info.totalMemory ? `${(device.info.totalMemory / 1073741824).toFixed(1)} GB` : $t('hardware.unknown') }}</dd></div>
        <div><dt>{{ $t('hardware.processors') }}</dt><dd>{{ device.info.physicalProcessors }} / {{ device.info.logicalProcessors }}</dd></div>
        <div><dt>{{ $t('hardware.frequency') }}</dt><dd>{{ device.info.processorMaxFreq ? `${(device.info.processorMaxFreq / 1000000000).toFixed(2)} GHz` : $t('hardware.unknown') }}</dd></div>
        <div><dt>{{ $t('hardware.graphics') }}</dt><dd>{{ device.info.graphicCard || $t('hardware.unknown') }}</dd></div>
        <div><dt>{{ $t('hardware.bitness') }}</dt><dd>{{ device.info.bitness || $t('hardware.unknown') }}</dd></div>
        <div><dt>{{ $t('hardware.disk') }}</dt><dd>{{ device.info.hwDiskId || $t('hardware.unknown') }}</dd></div>
        <div><dt>{{ $t('hardware.board') }}</dt><dd>{{ device.info.baseboardSerialNumber || $t('hardware.unknown') }}</dd></div>
      </dl>
      <p>{{ $t('hardware.related_users') }}: <span v-for="(account, index) in device.users" :key="account.uuid"><span v-if="index">, </span><NuxtLink :to="`/users/${account.uuid}`">{{ account.username }}</NuxtLink></span></p>
      <Message v-if="device.activeBan" severity="warn" :closable="false">
        <strong>{{ device.activeBan.reason }}</strong><br />
        {{ $t('hardware.expires') }}: {{ device.activeBan.expiresAt ? $moment(device.activeBan.expiresAt).format('lll') : $t('hardware.permanent') }}
      </Message>
      <div class="hardware-panel__actions" data-card-actions>
        <Button v-if="device.canBan && !device.activeBan" :label="$t('hardware.ban_device')" severity="danger" outlined @click="openBan([device])" />
        <Button v-if="device.canRevoke && device.activeBan" :label="$t('hardware.revoke')" outlined @click="openRevoke(device)" />
      </div>
      <details v-if="device.history.length" class="hardware-panel__history">
        <summary>{{ $t('hardware.history') }} ({{ device.history.length }})</summary>
        <ol>
          <li v-for="ban in device.history" :key="ban.id">
            <Tag :value="$t(`hardware.status_${ban.status}`)" :severity="ban.status === 'ACTIVE' ? 'danger' : 'secondary'" />
            {{ $moment(ban.issuedAt).format('lll') }} · {{ ban.reason }}
            <span v-if="ban.actorUuid"> · <NuxtLink :to="`/users/${ban.actorUuid}`">{{ ban.actorName || $t('hardware.moderator') }}</NuxtLink></span>
            <span v-else> · Gravit</span>
            <p>{{ $t('hardware.expires') }}: {{ ban.expiresAt ? $moment(ban.expiresAt).format('lll') : $t('hardware.permanent') }}</p>
            <p v-if="ban.revokedAt">{{ $moment(ban.revokedAt).format('lll') }} · {{ ban.revokeReason }}<span v-if="ban.revokedByUuid"> · <NuxtLink :to="`/users/${ban.revokedByUuid}`">{{ ban.revokedByName || $t('hardware.moderator') }}</NuxtLink></span></p>
          </li>
        </ol>
      </details>
    </article>
    <Dialog :visible="Boolean(dialog)" @update:visible="close" modal class="hardware-panel__dialog" :style="{ width: '34rem', maxWidth: 'calc(100vw - 2rem)' }" :header="$t(dialog === 'revoke' ? 'hardware.revoke' : 'hardware.ban_confirm')" :closable="!state.busy.value" :closeOnEscape="!state.busy.value" :dismissableMask="false">
      <form id="hardware-ban-form" class="hardware-panel__form" @submit.prevent="submit">
        <Message severity="warn" :closable="false">{{ $t(dialog === 'revoke' ? 'hardware.revoke_hint' : 'hardware.ban_hint', { count: selected.length }) }}</Message>
        <p>{{ $t('hardware.affected_users') }}: {{ affectedUsers }}</p>
        <label for="hardware-reason">{{ $t('hardware.reason') }}</label>
        <Textarea id="hardware-reason" v-model="reason" required maxlength="2048" rows="3" :disabled="state.busy.value" autofocus />
        <template v-if="dialog === 'ban'">
          <label for="hardware-expires">{{ $t('hardware.expires') }}</label>
          <input id="hardware-expires" v-model="expires" type="datetime-local" class="p-inputtext p-component" :disabled="state.busy.value" />
          <small>{{ $t('hardware.expiry_hint') }}</small>
        </template>
        <Message v-if="state.error.value" severity="error" :closable="false">{{ state.error.value }}</Message>
      </form>
      <template #footer>
        <Button :label="$t('common.cancel')" text :disabled="state.busy.value" @click="close" />
        <Button type="submit" form="hardware-ban-form" :label="$t(dialog === 'revoke' ? 'hardware.revoke' : 'hardware.ban_confirm')" :severity="dialog === 'revoke' ? 'primary' : 'danger'" :loading="state.busy.value" :disabled="!reason.trim()" />
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ uuid: string }>()
const state = useUserHardware(toRef(props, 'uuid'))
const { $t } = useNuxtApp() as any
const dialog = ref<'ban' | 'revoke' | null>(null)
const selected = ref<any[]>([])
const reason = ref('')
const expires = ref('')
const bannable = computed(() => state.devices.value.filter((device) => device.canBan && !device.activeBan))
const affectedUsers = computed(() => [...new Set(selected.value.flatMap((device) => device.users.map((user: any) => user.username)))].join(', '))
function close() { if (!state.busy.value) dialog.value = null }
function openBan(devices: any[]) { selected.value = devices.map((device) => ({ ...device })); reason.value = ''; expires.value = ''; state.error.value = ''; dialog.value = 'ban' }
function openRevoke(device: any) { selected.value = [{ ...device }]; reason.value = ''; state.error.value = ''; dialog.value = 'revoke' }
async function submit() {
  if (!reason.value.trim()) return
  let expiresAt: string | null = null
  if (dialog.value === 'ban' && expires.value) {
    const date = new Date(expires.value)
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) { state.error.value = $t('hardware.invalid_expiry'); return }
    expiresAt = date.toISOString()
  }
  const device = selected.value[0]
  const success = dialog.value === 'revoke'
    ? await state.action(`/${device.id}/revoke`, { banId: device.activeBan.id, revision: device.revision, reason: reason.value })
    : await state.action('/ban', { userUuid: props.uuid, devices: selected.value.map(({ id, revision }) => ({ id, revision })), reason: reason.value, expiresAt })
  if (success) dialog.value = null
}
</script>

<style scoped>
.hardware-panel__toolbar, .hardware-panel__heading, .hardware-panel__actions { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.hardware-panel__toolbar p { max-width: 65ch; }
.hardware-panel__device { border-top: 1px solid var(--surface-border); padding-block: 1.5rem; overflow-wrap: anywhere; }
.hardware-panel__heading h3 { margin: 0; }
.hardware-panel__facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); gap: 1rem 1.5rem; margin-block: 1.5rem; }
.hardware-panel__facts dt { color: var(--text-color-secondary); }
.hardware-panel__facts dd { margin: .25rem 0 0; }
.hardware-panel__actions { justify-content: flex-start; margin-top: 1rem; }
.hardware-panel__history { margin-top: 1.5rem; }
.hardware-panel__history summary { cursor: pointer; padding-block: .5rem; }
.hardware-panel__history li { margin-block: 1rem; }
.hardware-panel__form { display: flex; flex-direction: column; gap: .75rem; }
.hardware-panel__form label:not(:first-child) { margin-top: .5rem; }
</style>

<style>
.hardware-panel__dialog .p-dialog-footer { flex-wrap: wrap; }
.hardware-panel__dialog .p-button { white-space: normal; }
</style>

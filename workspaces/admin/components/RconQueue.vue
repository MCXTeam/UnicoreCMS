<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :style="{ width: '900px' }"
    :modal="true"
    :header="`${$t('admin.rcon_queue')} — ${serverId}`"
    class="p-fluid"
  >
    <div class="flex justify-content-between align-items-center mb-3">
      <span class="text-color-secondary">{{ $t('admin.rcon_queue_hint') }}</span>
      <div class="flex gap-2">
        <Button :label="$t('admin.refresh')" icon="pi pi-refresh" class="p-button-secondary" @click="load" />
        <Button :label="$t('admin.rcon_retry_failed')" icon="pi pi-replay" class="p-button-warning" @click="retry" />
      </div>
    </div>

    <DataTable :value="items" :loading="loading" responsiveLayout="scroll" :rows="10" :paginator="items && items.length > 10">
      <Column field="label" :header="$t('admin.operation')">
        <template #body="s">
          <div>{{ s.data.label || '—' }}</div>
          <small class="command">{{ s.data.command }}</small>
        </template>
      </Column>
      <Column :header="$t('admin.status')" :style="{ width: '9rem' }">
        <template #body="s">
          <Tag :severity="statusSeverity(s.data.status)" :value="statusLabel(s.data.status)" />
          <div v-if="s.data.error" class="text-red-500 text-xs mt-1">{{ s.data.error }}</div>
        </template>
      </Column>
      <Column field="attempts" :header="$t('admin.attempts')" :style="{ width: '6rem' }" />
      <Column :header="$t('admin.created')" :style="{ width: '11rem' }">
        <template #body="s">{{ $moment(s.data.created).format('DD.MM.YYYY HH:mm') }}</template>
      </Column>
      <template #empty>
        <div class="text-center p-4 text-color-secondary">{{ $t('admin.rcon_queue_empty') }}</div>
      </template>
    </DataTable>

    <template #footer>
      <Button :label="$t('admin.close')" icon="pi pi-times" class="p-button-text" @click="$emit('update:visible', false)" />
    </template>
  </Dialog>
</template>

<script>
import { RconCommandStatus } from 'unicore-common/issuance'

export default {
  props: {
    visible: { type: Boolean, default: false },
    serverId: { type: String, default: null },
  },
  emits: ['update:visible'],
  data() {
    return {
      items: [],
      loading: false,
    }
  },
  watch: {
    visible(value) {
      if (value && this.serverId) this.load()
    },
  },
  methods: {
    async load() {
      if (!this.serverId) return
      this.loading = true
      try {
        this.items = await this.$api.get(`/rcon/${this.serverId}/queue`).then((res) => res.data)
      } catch {
        this.items = []
      }
      this.loading = false
    },
    async retry() {
      try {
        await this.$api.post(`/rcon/${this.serverId}/retry`)
        this.$toast.add({ severity: 'success', detail: this.$t('admin.rcon_requeued'), life: 3000 })
        await this.load()
      } catch {
        this.$toast.add({ severity: 'error', detail: this.$t('admin.rcon_requeue_failed'), life: 3000 })
      }
    },
    statusLabel(status) {
      if (status === RconCommandStatus.Sent) return this.$t('admin.rcon_status_sent')
      if (status === RconCommandStatus.Failed) return this.$t('admin.rcon_status_failed')
      if (status === RconCommandStatus.Processing) return this.$t('admin.rcon_status_processing')
      return this.$t('admin.rcon_status_queued')
    },
    statusSeverity(status) {
      if (status === RconCommandStatus.Sent) return 'success'
      if (status === RconCommandStatus.Failed) return 'danger'
      if (status === RconCommandStatus.Processing) return 'info'
      return 'warn'
    },
  },
}
</script>

<style scoped>
.command {
  display: block;
  color: var(--p-text-muted-color);
  font-family: monospace;
  font-size: 0.75rem;
  word-break: break-all;
}
</style>

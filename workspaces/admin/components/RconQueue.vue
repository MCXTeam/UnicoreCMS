<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :style="{ width: '900px' }"
    :modal="true"
    :header="'Очередь RCON — ' + serverId"
    class="p-fluid"
  >
    <div class="flex justify-content-between align-items-center mb-3">
      <span class="text-color-secondary">Команды, поставленные в очередь на выполнение через RCON.</span>
      <div class="flex gap-2">
        <Button label="Обновить" icon="pi pi-refresh" class="p-button-secondary" @click="load" />
        <Button label="Повторить неудачные" icon="pi pi-replay" class="p-button-warning" @click="retry" />
      </div>
    </div>

    <DataTable :value="items" :loading="loading" responsiveLayout="scroll" :rows="10" :paginator="items && items.length > 10">
      <Column field="label" header="Операция">
        <template #body="s">
          <div>{{ s.data.label || '—' }}</div>
          <small class="command">{{ s.data.command }}</small>
        </template>
      </Column>
      <Column header="Статус" :styles="{ width: '9rem' }">
        <template #body="s">
          <Tag :severity="statusSeverity(s.data.status)" :value="statusLabel(s.data.status)" />
          <div v-if="s.data.error" class="text-red-500 text-xs mt-1">{{ s.data.error }}</div>
        </template>
      </Column>
      <Column field="attempts" header="Попытки" :styles="{ width: '6rem' }" />
      <Column header="Создано" :styles="{ width: '11rem' }">
        <template #body="s">{{ $moment(s.data.created).format('DD.MM.YYYY HH:mm') }}</template>
      </Column>
      <template #empty>
        <div class="text-center p-4 text-color-secondary">Очередь пуста</div>
      </template>
    </DataTable>

    <template #footer>
      <Button label="Закрыть" icon="pi pi-times" class="p-button-text" @click="$emit('update:visible', false)" />
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
        this.$toast.add({ severity: 'success', detail: 'Неудачные команды поставлены в очередь заново', life: 3000 })
        await this.load()
      } catch {
        this.$toast.add({ severity: 'error', detail: 'Не удалось перезапустить', life: 3000 })
      }
    },
    statusLabel(status) {
      if (status === RconCommandStatus.Sent) return 'Выполнено'
      if (status === RconCommandStatus.Failed) return 'Ошибка'
      return 'В очереди'
    },
    statusSeverity(status) {
      if (status === RconCommandStatus.Sent) return 'success'
      if (status === RconCommandStatus.Failed) return 'danger'
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

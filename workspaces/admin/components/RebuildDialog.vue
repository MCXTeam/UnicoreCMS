<template>
  <Dialog
    :visible="visible"
    modal
    :header="$t('admin.rebuild_title')"
    :style="{ width: '720px' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <p class="mt-0 text-color-secondary">{{ $t('admin.rebuild_hint') }}</p>
    <div class="flex align-items-center gap-3 mb-3">
      <div class="flex align-items-center gap-2">
        <Checkbox :binary="true" inputId="rebuild-client" v-model="sides.client" :disabled="rebuild.running" />
        <label for="rebuild-client" class="m-0">{{ $t('admin.rebuild_client') }}</label>
      </div>
      <div class="flex align-items-center gap-2">
        <Checkbox :binary="true" inputId="rebuild-admin" v-model="sides.admin" :disabled="rebuild.running" />
        <label for="rebuild-admin" class="m-0">{{ $t('admin.rebuild_admin') }}</label>
      </div>
      <Tag v-if="rebuild.running" severity="info" :value="$t('admin.rebuild_running', { side: rebuild.side || '—' })" />
      <Tag v-else-if="rebuild.ok === true" severity="success" :value="$t('admin.rebuild_done')" />
      <Tag v-else-if="rebuild.ok === false" severity="danger" :value="rebuild.error || $t('admin.rebuild_failed')" />
    </div>
    <pre ref="logEl" class="rebuild-log">{{ rebuild.log.join('\n') || $t('admin.rebuild_log_empty') }}</pre>
    <template #footer>
      <Button :label="$t('common.close')" icon="pi pi-times" class="p-button-text" @click="$emit('update:visible', false)" />
      <Button
        v-if="rebuild.running"
        :label="$t('admin.rebuild_stop')"
        icon="pi pi-stop"
        class="p-button-text p-button-danger"
        @click="stopRebuild()"
      />
      <Button
        v-else
        :label="$t('admin.rebuild_start')"
        icon="pi pi-sync"
        class="p-button-text"
        :disabled="!sides.client && !sides.admin"
        @click="startRebuild()"
      />
    </template>
  </Dialog>
</template>

<script>
import { REBUILD_POLL_MS } from '~/constants'

export default {
  props: {
    visible: { type: Boolean, default: false },
  },
  emits: ['update:visible'],
  data() {
    return {
      rebuild: { running: false, log: [] },
      sides: { client: true, admin: true },
      timer: null,
    }
  },
  watch: {
    visible(value) {
      if (value) this.poll()
      else clearTimeout(this.timer)
    },
  },
  mounted() {
    if (this.visible) this.poll()
  },
  beforeUnmount() {
    clearTimeout(this.timer)
  },
  methods: {
    async poll() {
      clearTimeout(this.timer)

      const state = await this.$api
        .get('/admin/modules/rebuild')
        .then((res) => res.data)
        .catch(() => null)

      if (state) this.rebuild = state

      if (this.rebuild.running || this.visible) this.timer = setTimeout(() => this.poll(), REBUILD_POLL_MS)
    },
    async startRebuild() {
      const sides = Object.keys(this.sides).filter((side) => this.sides[side])

      this.rebuild = await this.$api
        .post('/admin/modules/rebuild', { sides })
        .then((res) => res.data)
        .catch(() => this.rebuild)

      this.poll()
    },
    async stopRebuild() {
      this.rebuild = await this.$api
        .delete('/admin/modules/rebuild')
        .then((res) => res.data)
        .catch(() => this.rebuild)

      this.poll()
    },
  },
}
</script>

<style scoped>
.rebuild-log {
  max-height: 320px;
  overflow: auto;
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--p-content-border-color);
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

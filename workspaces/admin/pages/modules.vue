<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <DataTable :value="modules" :loading="loading" responsiveLayout="scroll" dataKey="id">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.modules_title') }}</h5>
              <div class="flex align-items-center">
                <ExtensionInstall v-if="canManage" @installed="load()" />
                <Button
                  v-if="canManage"
                  :label="$t('admin.rebuild')"
                  icon="pi pi-sync"
                  class="p-button-text"
                  :loading="rebuild.running"
                  @click="openRebuild()"
                />
                <Button :label="$t('admin.refresh')" icon="pi pi-refresh" class="p-button-text" @click="load()" />
              </div>
            </div>
          </template>
          <template #empty>
            <div class="py-4 text-center">
              <p class="m-0">{{ $t('admin.modules_empty') }}</p>
              <small class="text-color-secondary">{{ $t('admin.modules_empty_hint') }}</small>
            </div>
          </template>
          <Column field="id" header="ID" :style="{ width: '10rem' }" />
          <Column :header="$t('admin.name')">
            <template #body="slotProps">
              <div class="font-medium">{{ localized(slotProps.data.name) }}</div>
              <small class="text-color-secondary">{{ localized(slotProps.data.description) }}</small>
            </template>
          </Column>
          <Column field="version" :header="$t('admin.version')" :style="{ width: '8rem' }" />
          <Column :header="$t('admin.modules_parts')" :style="{ width: '12rem' }">
            <template #body="slotProps">
              <Tag v-if="slotProps.data.hasServer" class="mr-1 mb-1" severity="info" value="server" />
              <Tag v-if="slotProps.data.hasClient" class="mr-1 mb-1" severity="success" value="client" />
              <Tag v-if="slotProps.data.hasAdmin" class="mr-1 mb-1" severity="warning" value="admin" />
            </template>
          </Column>
          <Column :header="$t('admin.status')" :style="{ width: '12rem' }">
            <template #body="slotProps">
              <Tag :severity="severity(slotProps.data.status)" :value="$t(`admin.module_status_${slotProps.data.status}`)" />
              <small v-if="slotProps.data.reason" class="block mt-1 p-error">{{ slotProps.data.reason }}</small>
            </template>
          </Column>
          <Column :style="{ width: '14rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button
                v-if="canManage && slotProps.data.status !== 'disabled'"
                :label="$t('admin.disable')"
                icon="pi pi-power-off"
                class="p-button-text p-button-warning"
                :disabled="loading || slotProps.data.status === 'broken'"
                @click="setEnabled(slotProps.data, false)"
              />
              <Button
                v-else-if="canManage"
                :label="$t('admin.enable')"
                icon="pi pi-check"
                class="p-button-text p-button-success"
                :disabled="loading"
                @click="setEnabled(slotProps.data, true)"
              />
              <Button
                v-if="slotProps.data.config && slotProps.data.config.length"
                icon="pi pi-cog"
                class="p-button-rounded p-button-text"
                :disabled="loading"
                @click="openSettings(slotProps.data)"
              />
              <Button
                v-if="canManage && slotProps.data.status !== 'active'"
                icon="pi pi-trash"
                class="p-button-rounded p-button-text p-button-danger"
                :disabled="loading"
                @click="confirmRemove(slotProps.data)"
              />
            </template>
          </Column>
        </DataTable>

        <Dialog v-model:visible="rebuildDialog" :modal="true" :header="$t('admin.rebuild_title')" :style="{ width: '720px' }">
          <p class="mt-0 text-color-secondary">{{ $t('admin.rebuild_hint') }}</p>
          <div class="flex align-items-center gap-3 mb-3">
            <div class="flex align-items-center gap-2">
              <Checkbox :binary="true" inputId="rebuild-client" v-model="rebuildSides.client" :disabled="rebuild.running" />
              <label for="rebuild-client" class="m-0">{{ $t('admin.rebuild_client') }}</label>
            </div>
            <div class="flex align-items-center gap-2">
              <Checkbox :binary="true" inputId="rebuild-admin" v-model="rebuildSides.admin" :disabled="rebuild.running" />
              <label for="rebuild-admin" class="m-0">{{ $t('admin.rebuild_admin') }}</label>
            </div>
            <Tag v-if="rebuild.running" severity="info" :value="$t('admin.rebuild_running', { side: rebuild.side || '—' })" />
            <Tag v-else-if="rebuild.ok === true" severity="success" :value="$t('admin.rebuild_done')" />
            <Tag v-else-if="rebuild.ok === false" severity="danger" :value="rebuild.error || $t('admin.rebuild_failed')" />
          </div>
          <pre ref="rebuildLog" class="rebuild-log">{{ rebuild.log.join('\n') || $t('admin.rebuild_log_empty') }}</pre>
          <template #footer>
            <Button :label="$t('common.close')" icon="pi pi-times" class="p-button-text" @click="rebuildDialog = false" />
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
              :disabled="!rebuildSides.client && !rebuildSides.admin"
              @click="startRebuild()"
            />
          </template>
        </Dialog>

        <Dialog v-model:visible="settingsDialog" :modal="true" :header="$t('admin.module_settings')" :style="{ width: '520px' }" class="p-fluid">
          <div v-for="item in settings" :key="item.key" class="field">
            <label class="flex align-items-center gap-1">
              {{ item.field.label ? $t(item.field.label) : item.field.key }}
              <i v-if="item.field.hint" v-tooltip.right="$t(item.field.hint)" class="pi pi-question-circle text-color-secondary" />
            </label>
            <InputText v-if="item.field.type === 'string'" v-model="item.value" />
            <InputNumber
              v-else-if="item.field.type === 'number'"
              :modelValue="Number(item.value)"
              @update:modelValue="item.value = String($event ?? '')"
              @input="item.value = String($event.value ?? '')"
              :min="item.field.min"
              :max="item.field.max"
            />
            <div v-else-if="item.field.type === 'boolean'" class="flex align-items-center gap-2">
              <Checkbox :binary="true" :modelValue="item.value === 'true'" @update:modelValue="item.value = String($event)" />
            </div>
            <Select
              v-else-if="item.field.type === 'select'"
              v-model="item.value"
              :options="item.field.options"
              optionLabel="label"
              optionValue="value"
              appendTo="body"
            />

          </div>
          <template #footer>
            <Button :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="settingsDialog = false" />
            <Button
              :label="$t('common.save')"
              icon="pi pi-check"
              class="p-button-text"
              :disabled="loading || !canManage"
              @click="saveSettings()"
            />
          </template>
        </Dialog>
      </div>
    </div>
  </div>
</template>

<script>
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { REBUILD_POLL_MS } from '~/constants'

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_modules')) })

    const access = useAccess({ canManage: 'panel.extensions.manage' })

    return { toast: useToast(), confirm: useConfirm(), locale: useLocale(), ...access }
  },
  data() {
    return {
      modules: [],
      loading: true,
      settingsDialog: false,
      settings: [],
      settingsModule: null,
      rebuildDialog: false,
      rebuildSides: { client: true, admin: true },
      rebuild: { running: false, side: null, ok: null, error: null, log: [] },
      rebuildTimer: null,
    }
  },
  mounted() {
    this.load()
    this.pollRebuild()
  },
  beforeUnmount() {
    clearTimeout(this.rebuildTimer)
  },
  methods: {
    localized(value) {
      if (!value) return ''
      if (typeof value === 'string') return value

      return value[this.locale] || value.ru || value.en || Object.values(value)[0] || ''
    },
    severity(status) {
      if (status === 'active') return 'success'
      if (status === 'broken') return 'danger'
      if (status === 'new') return 'info'

      return 'secondary'
    },
    async load() {
      this.loading = true
      this.modules = await this.$api
        .get('/admin/modules')
        .then((res) => res.data)
        .catch(() => [])
      this.loading = false
    },
    async setEnabled(module, enabled) {
      this.loading = true

      const result = await this.$api
        .patch(`/admin/modules/${module.id}`, { enabled })
        .then((res) => res.data)
        .catch(() => null)

      this.loading = false

      if (!result) return

      this.toast.add({
        severity: 'warn',
        summary: this.$t(enabled ? 'admin.module_enabled' : 'admin.module_disabled'),
        detail: this.$t(result.rebuildRequired ? 'admin.module_restart_rebuild' : 'admin.module_restart'),
        life: 8000,
      })

      await this.load()
    },
    async pollRebuild() {
      clearTimeout(this.rebuildTimer)

      const state = await this.$api
        .get('/admin/modules/rebuild')
        .then((res) => res.data)
        .catch(() => null)

      if (state) this.rebuild = state

      if (this.rebuild.running || this.rebuildDialog) this.rebuildTimer = setTimeout(() => this.pollRebuild(), REBUILD_POLL_MS)
    },
    openRebuild() {
      this.rebuildDialog = true
      this.pollRebuild()
    },
    async startRebuild() {
      const sides = Object.keys(this.rebuildSides).filter((side) => this.rebuildSides[side])

      this.rebuild = await this.$api
        .post('/admin/modules/rebuild', { sides })
        .then((res) => res.data)
        .catch(() => this.rebuild)

      this.pollRebuild()
    },
    async stopRebuild() {
      this.rebuild = await this.$api
        .delete('/admin/modules/rebuild')
        .then((res) => res.data)
        .catch(() => this.rebuild)

      this.pollRebuild()
    },
    async openSettings(module) {
      this.loading = true
      this.settingsModule = module
      this.settings = await this.$api
        .get(`/admin/modules/${module.id}/settings`)
        .then((res) => res.data)
        .catch(() => [])
      this.loading = false
      this.settingsDialog = true
    },

    async saveSettings() {
      this.loading = true

      for (const item of this.settings)
        await this.$api
          .patch('/config', { key: item.key, value: item.value, type: this.configType(item.field.type) })
          .catch(() => null)

      this.loading = false
      this.settingsDialog = false
      this.toast.add({ severity: 'success', summary: this.$t('admin.saved'), life: 3000 })
    },

    configType(type) {
      if (type === 'number') return 0
      if (type === 'boolean') return 2

      return 1
    },

    confirmRemove(module) {
      this.confirm.require({
        message: this.$t('admin.module_remove_confirm'),
        header: module.id,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: this.$t('admin.extension_remove'),
        rejectLabel: this.$t('admin.extension_keep'),
        accept: async () => {
          this.loading = true

          const result = await this.$api
            .delete(`/admin/extensions/module/${module.id}`)
            .then((res) => res.data)
            .catch((error) => {
              this.toast.add({
                severity: 'error',
                summary: this.$t('admin.module_remove_error'),
                detail: error.response?.data?.message || this.$t('common.unknown_error'),
                life: 8000,
              })

              return null
            })

          this.loading = false

          if (result) this.toast.add({ severity: 'success', summary: this.$t('admin.module_removed'), life: 4000 })

          await this.load()
        },
      })
    },
  },
}
</script>

<style scoped>
.rebuild-log {
  max-height: 320px;
  overflow: auto;
  margin: 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--surface-100);
  color: var(--text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>

<template>
  <div class="grid">
    <RebuildDialog v-model:visible="rebuildDialog" :preset="rebuildSides" />
    <div class="col-12">
      <div class="card">
        <div class="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <h1 class="m-0">{{ $t('admin.menu_modules') }}</h1>
          <div class="flex flex-wrap gap-2">
            <ExtensionInstall v-if="canManage" @installed="afterInstall($event)" />
            <Button v-if="canManage" :label="$t('admin.rebuild')" icon="pi pi-sync" outlined @click="openRebuild()" />
            <Button :label="$t('admin.refresh')" icon="pi pi-refresh" text :loading="loading" @click="load()" />
          </div>
        </div>
        <div class="flex flex-wrap gap-2 mb-4" role="group" :aria-label="$t('admin.menu_modules')">
          <Button :label="$t('admin.extensions_installed')" :outlined="activeTab !== 'installed'" :aria-pressed="activeTab === 'installed'" @click="activeTab = 'installed'" />
          <Button :label="$t('admin.extensions_catalog')" :outlined="activeTab !== 'catalog'" :aria-pressed="activeTab === 'catalog'" @click="activeTab = 'catalog'" />
        </div>
        <ExtensionCatalog v-show="activeTab === 'catalog'" kind="module" :canManage="canManage" @installed="afterInstall($event)" />
        <ExtensionList v-show="activeTab === 'installed'" :items="modules" :loading="loading">
          <template #empty>
            <p class="m-0">{{ $t('admin.modules_empty') }}</p>
            <small class="text-color-secondary">{{ $t('admin.modules_empty_hint') }}</small>
          </template>
          <template #summary="{ item }">
            <h3>{{ localized(item.name) }}</h3>
            <small>{{ item.id }} · v{{ item.version }}</small>
            <p>{{ localized(item.description) }}</p>
          </template>
          <template #state="{ item }">
            <Tag :severity="severity(item.status)" :value="$t(`admin.module_status_${item.status}`)" />
            <small v-if="item.reason" class="block mt-1 p-error">{{ $t(item.reason) }}</small>
            <div class="flex flex-wrap gap-2 mt-2">
              <Tag v-if="item.hasServer" severity="secondary" :value="$t('updates.part.server')" />
              <Tag v-if="item.hasClient" severity="secondary" :value="$t('updates.part.client')" />
              <Tag v-if="item.hasAdmin" severity="secondary" :value="$t('updates.part.admin')" />
            </div>
          </template>
          <template #item-actions="{ item }">
            <Button v-if="canManage && item.config?.length" :label="$t('admin.menu_settings')" icon="pi pi-cog" outlined :disabled="loading" @click="openSettings(item)" />
            <Button v-if="canManage && item.status !== 'disabled'" :label="$t('admin.disable')" icon="pi pi-power-off" text severity="warn" :disabled="loading || item.status === 'broken'" @click="setEnabled(item, false)" />
            <Button v-else-if="canManage" :label="$t('admin.enable')" icon="pi pi-check" text severity="success" :disabled="loading" @click="setEnabled(item, true)" />
            <Button v-if="canManage && item.status !== 'active'" icon="pi pi-trash" :aria-label="$t('admin.delete')" text severity="danger" :disabled="loading" @click="confirmRemove(item)" />
          </template>
        </ExtensionList>

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

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_modules')) })

    const access = useAccess({ canManage: 'panel.extensions.manage' })

    return { toast: useToast(), confirm: useConfirm(), locale: useLocale(), ...access }
  },
  data() {
    return {
      activeTab: 'installed',
      modules: [],
      loading: true,
      settingsDialog: false,
      settings: [],
      settingsModule: null,
      rebuildDialog: false,
      rebuildSides: null,
    }
  },
  mounted() {
    this.load()
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
    openRebuild(sides = null) {
      this.rebuildSides = sides
      this.rebuildDialog = true
    },
    async afterInstall(result) {
      await this.load()

      if (result?.steps?.rebuild) this.openRebuild(result.sides)
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

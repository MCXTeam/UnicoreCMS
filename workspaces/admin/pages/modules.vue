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

        <Dialog :visible="settingsDialog" @update:visible="requestSettingsClose" :modal="true" :header="localized(settingsModule?.name)" :style="{ width: '1100px', maxWidth: 'calc(100vw - 32px)' }">
          <SettingsPanel ref="moduleSettings" v-if="settingsModule" :key="settingsModule.id" :catalogUrl="`/admin/modules/${settingsModule.id}/settings/catalog`" :saveUrl="`/admin/modules/${settingsModule.id}/settings`" :editable="canManage" closable @close="settingsDialog = false" />
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
      try {
        this.modules = await this.$api.get('/admin/modules').then((res) => res.data)
      } catch (error) {
        if (error.response?.status !== 403) {
          this.$toast.add({ severity: 'error', detail: this.$t('error.request_failed'), life: 5000 })
        }
      } finally {
        this.loading = false
      }
    },
    async setEnabled(module, enabled) {
      this.loading = true

      const result = await this.$api
        .patch(`/admin/modules/${module.id}`, { enabled })
        .then((res) => res.data)
        .catch((error) => {
          if (error.response?.status !== 403) {
            this.$toast.add({ severity: 'error', detail: this.$t('error.request_failed'), life: 5000 })
          }
          return null
        })

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
    openSettings(module) {
      this.settingsModule = module
      this.settingsDialog = true
    },
    requestSettingsClose(visible) {
      if (!visible) this.$refs.moduleSettings?.close()
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

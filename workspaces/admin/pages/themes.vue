<template>
  <div class="grid">
    <div class="col-12">
      <div class="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <h1 class="m-0">{{ $t('admin.menu_themes') }}</h1>
        <div class="flex flex-wrap gap-2">
          <ExtensionInstall v-if="canManage" @installed="afterInstall($event)" />
          <Button v-if="canManage" :label="$t('admin.rebuild')" icon="pi pi-sync" outlined @click="openRebuild()" />
          <Button :label="$t('admin.refresh')" icon="pi pi-refresh" text :loading="loading" @click="load()" />
        </div>
      </div>
      <div class="flex flex-wrap gap-2" role="group" :aria-label="$t('admin.menu_themes')">
        <Button :label="$t('admin.extensions_installed')" :outlined="activeTab !== 'installed'" :aria-pressed="activeTab === 'installed'" @click="activeTab = 'installed'" />
        <Button :label="$t('admin.extensions_catalog')" :outlined="activeTab !== 'catalog'" :aria-pressed="activeTab === 'catalog'" @click="activeTab = 'catalog'" />
      </div>
    </div>
    <RebuildDialog v-model:visible="rebuildDialog" :preset="rebuildSides" />
    <div v-show="activeTab === 'installed'" v-for="section in sections" :key="section.side" class="col-12">
      <div class="card">
        <ExtensionList :items="section.themes" :loading="loading">
          <template #heading><h2 class="m-0">{{ $t(section.title) }}</h2></template>
          <template #empty>
            <p class="m-0">{{ $t('admin.themes_empty') }}</p>
            <small class="text-color-secondary">{{ $t('admin.themes_empty_hint') }}</small>
          </template>
          <template #summary="{ item }">
            <h3>{{ localized(item.name) }}</h3>
            <small>{{ item.id }} · v{{ item.version }}</small>
            <p v-if="item.replaces.length">{{ $t('admin.theme_replaces', { pages: item.replaces.join(', ') }) }}</p>
          </template>
          <template #state="{ item }">
            <Tag :severity="severity(item.status)" :value="$t(`admin.theme_status_${item.status}`)" />
            <small v-if="item.reason" class="block mt-1 p-error">{{ item.reason }}</small>
          </template>
          <template #item-actions="{ item }">
            <Button v-if="canManage && item.status === 'active'" :label="$t('admin.theme_reset')" v-tooltip.top="$t('admin.theme_deactivate')" icon="pi pi-power-off" text severity="warn" :disabled="loading || locked[section.side]" @click="setActive(null, section.side)" />
            <Button v-else-if="canManage" :label="$t('admin.theme_apply')" v-tooltip.top="$t('admin.theme_activate')" icon="pi pi-check" text severity="success" :disabled="loading || locked[section.side] || item.status !== 'available'" @click="setActive(item.id, section.side)" />
            <Button v-if="canManage && item.status !== 'active'" icon="pi pi-trash" :aria-label="$t('admin.delete')" text severity="danger" :disabled="loading" @click="confirmRemove(item)" />
          </template>
        </ExtensionList>

        <Message v-if="locked[section.side]" severity="warn" :closable="false" class="mt-3">
          {{ $t(section.side === 'admin' ? 'admin.theme_locked_admin' : 'admin.theme_locked') }}
        </Message>
        <Message v-else severity="info" :closable="false" class="mt-3">
          {{ $t(section.side === 'admin' ? 'admin.theme_hint_admin' : 'admin.theme_hint') }}
        </Message>
      </div>
    </div>
    <div v-show="activeTab === 'catalog'" class="col-12">
      <ExtensionCatalog class="card" kind="theme" :canManage="canManage" @installed="afterInstall($event)" />
    </div>
  </div>
</template>

<script>
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const SECTIONS = [
  { side: 'client', title: 'admin.themes_title' },
  { side: 'admin', title: 'admin.themes_title_admin' },
]

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_themes')) })

    const access = useAccess({ canManage: 'panel.extensions.manage' })

    return { toast: useToast(), confirm: useConfirm(), locale: useLocale(), ...access }
  },
  data() {
    return {
      activeTab: 'installed',
      themes: [],
      locked: { client: false, admin: false },
      rebuildDialog: false,
      rebuildSides: null,
      loading: true,
    }
  },
  computed: {
    sections() {
      return SECTIONS.map((section) => ({
        ...section,
        themes: this.themes.filter((theme) => theme.side === section.side),
      }))
    },
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
    openRebuild(sides = null) {
      this.rebuildSides = sides
      this.rebuildDialog = true
    },
    async afterInstall(result) {
      await this.load()

      if (result?.steps?.rebuild) this.openRebuild(result.sides)
    },
    severity(status) {
      if (status === 'active') return 'success'
      if (status === 'broken' || status === 'incompatible') return 'danger'

      return 'secondary'
    },
    async load() {
      this.loading = true

      const data = await this.$api
        .get('/admin/themes')
        .then((res) => res.data)
        .catch(() => null)

      this.themes = data?.themes || []
      this.locked = data?.locked || { client: false, admin: false }
      this.loading = false
    },
    confirmRemove(theme) {
      this.confirm.require({
        message: this.$t('admin.theme_remove_confirm'),
        header: theme.id,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: this.$t('admin.extension_remove'),
        rejectLabel: this.$t('admin.extension_keep'),
        accept: async () => {
          this.loading = true

          const result = await this.$api
            .delete(`/admin/extensions/theme/${theme.id}`)
            .then((res) => res.data)
            .catch((error) => {
              this.toast.add({
                severity: 'error',
                summary: this.$t('admin.theme_remove_error'),
                detail: error.response?.data?.message || this.$t('common.unknown_error'),
                life: 8000,
              })

              return null
            })

          this.loading = false

          if (result) this.toast.add({ severity: 'success', summary: this.$t('admin.theme_removed'), life: 4000 })

          await this.load()
        },
      })
    },

    async setActive(id, side) {
      this.loading = true

      const result = await this.$api
        .put('/admin/themes/active', { id, side })
        .then((res) => res.data)
        .catch(() => null)

      this.loading = false

      if (!result) return

      this.toast.add({
        severity: 'warn',
        summary: this.$t(id ? 'admin.theme_activated' : 'admin.theme_deactivated'),
        detail: this.$t(side === 'admin' ? 'admin.theme_rebuild_admin' : 'admin.theme_rebuild'),
        life: 8000,
      })

      await this.load()
    },
  },
}
</script>

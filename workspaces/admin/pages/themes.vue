<template>
  <div class="grid">
    <div v-for="section in sections" :key="section.side" class="col-12">
      <div class="card">
        <DataTable :value="section.themes" :loading="loading" responsiveLayout="scroll" dataKey="id">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t(section.title) }}</h5>
              <div class="flex align-items-center">
                <ExtensionInstall @installed="load()" />
                <Button :label="$t('admin.refresh')" icon="pi pi-refresh" class="p-button-text" @click="load()" />
              </div>
            </div>
          </template>
          <template #empty>
            <div class="py-4 text-center">
              <p class="m-0">{{ $t('admin.themes_empty') }}</p>
              <small class="text-color-secondary">{{ $t('admin.themes_empty_hint') }}</small>
            </div>
          </template>
          <Column field="id" header="ID" :style="{ width: '10rem' }" />
          <Column :header="$t('admin.name')">
            <template #body="slotProps">
              <div class="font-medium">{{ localized(slotProps.data.name) }}</div>
              <small v-if="slotProps.data.replaces.length" class="text-color-secondary">
                {{ $t('admin.theme_replaces', { pages: slotProps.data.replaces.join(', ') }) }}
              </small>
            </template>
          </Column>
          <Column field="version" :header="$t('admin.version')" :style="{ width: '8rem' }" />
          <Column :header="$t('admin.status')" :style="{ width: '12rem' }">
            <template #body="slotProps">
              <Tag :severity="severity(slotProps.data.status)" :value="$t(`admin.theme_status_${slotProps.data.status}`)" />
              <small v-if="slotProps.data.reason" class="block mt-1 text-red-500">{{ slotProps.data.reason }}</small>
            </template>
          </Column>
          <Column :style="{ width: '14rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button
                v-if="slotProps.data.status === 'active'"
                :label="$t('admin.theme_deactivate')"
                icon="pi pi-power-off"
                class="p-button-text p-button-warning"
                :disabled="loading || locked[section.side]"
                @click="setActive(null, section.side)"
              />
              <Button
                v-else
                :label="$t('admin.theme_activate')"
                icon="pi pi-check"
                class="p-button-text p-button-success"
                :disabled="loading || locked[section.side] || slotProps.data.status !== 'available'"
                @click="setActive(slotProps.data.id, section.side)"
              />
              <Button
                v-if="slotProps.data.status !== 'active'"
                icon="pi pi-trash"
                class="p-button-rounded p-button-text p-button-danger"
                :disabled="loading"
                @click="confirmRemove(slotProps.data)"
              />
            </template>
          </Column>
        </DataTable>

        <Message v-if="locked[section.side]" severity="warn" :closable="false" class="mt-3">
          {{ $t(section.side === 'admin' ? 'admin.theme_locked_admin' : 'admin.theme_locked') }}
        </Message>
        <Message v-else severity="info" :closable="false" class="mt-3">
          {{ $t(section.side === 'admin' ? 'admin.theme_hint_admin' : 'admin.theme_hint') }}
        </Message>
      </div>
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

    return { toast: useToast(), confirm: useConfirm(), locale: useLocale() }
  },
  data() {
    return {
      themes: [],
      locked: { client: false, admin: false },
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

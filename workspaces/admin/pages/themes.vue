<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <DataTable :value="themes" :loading="loading" responsiveLayout="scroll" dataKey="id">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.themes_title') }}</h5>
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
                :disabled="loading || locked"
                @click="setActive(null)"
              />
              <Button
                v-else
                :label="$t('admin.theme_activate')"
                icon="pi pi-check"
                class="p-button-text p-button-success"
                :disabled="loading || locked || slotProps.data.status !== 'available'"
                @click="setActive(slotProps.data.id)"
              />
            </template>
          </Column>
        </DataTable>

        <Message v-if="locked" severity="warn" :closable="false" class="mt-3">{{ $t('admin.theme_locked') }}</Message>
        <Message v-else severity="info" :closable="false" class="mt-3">{{ $t('admin.theme_hint') }}</Message>
      </div>
    </div>
  </div>
</template>

<script>
import { useToast } from 'primevue/usetoast'

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_themes')) })

    return { toast: useToast(), locale: useLocale() }
  },
  data() {
    return {
      themes: [],
      locked: false,
      loading: true,
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
      this.locked = Boolean(data?.locked)
      this.loading = false
    },
    async setActive(id) {
      this.loading = true

      const result = await this.$api
        .put('/admin/themes/active', { id })
        .then((res) => res.data)
        .catch(() => null)

      this.loading = false

      if (!result) return

      this.toast.add({
        severity: 'warn',
        summary: this.$t(id ? 'admin.theme_activated' : 'admin.theme_deactivated'),
        detail: this.$t('admin.theme_rebuild'),
        life: 8000,
      })

      await this.load()
    },
  },
}
</script>

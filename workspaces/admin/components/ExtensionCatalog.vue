<template>
  <div class="card">
    <DataTable :value="entries" :loading="loading" responsiveLayout="scroll" dataKey="key">
      <template #header>
        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
          <div>
            <h5 class="m-0">{{ $t(kind === 'module' ? 'admin.catalog_modules' : 'admin.catalog_themes') }}</h5>
            <small class="text-color-secondary">{{ $t('admin.catalog_hint') }}</small>
          </div>
          <div class="flex align-items-center">
            <Button
              v-if="canManage"
              :label="$t('admin.catalog_by_url')"
              icon="pi pi-link"
              class="p-button-text"
              @click="urlDialog = true"
            />
            <Button
              v-if="canManage"
              :label="$t('admin.catalog_sources')"
              icon="pi pi-server"
              class="p-button-text"
              @click="sourcesDialog = true"
            />
            <Button :label="$t('admin.refresh')" icon="pi pi-refresh" class="p-button-text" :loading="loading" @click="load(true)" />
          </div>
        </div>
      </template>
      <template #empty>
        <div class="py-4 text-center">
          <p class="m-0">{{ $t('admin.catalog_empty') }}</p>
          <small class="text-color-secondary">{{ $t('admin.catalog_empty_hint') }}</small>
        </div>
      </template>
      <Column field="id" header="ID" :style="{ width: '10rem' }" />
      <Column :header="$t('admin.name')">
        <template #body="slotProps">
          <div class="font-medium">{{ localized(slotProps.data.name) }}</div>
          <small class="text-color-secondary">{{ localized(slotProps.data.description) }}</small>
        </template>
      </Column>
      <Column :header="$t('admin.version')" :style="{ width: '12rem' }">
        <template #body="slotProps">
          <div>{{ slotProps.data.version }}</div>
          <small v-if="slotProps.data.installedVersion" class="text-color-secondary">
            {{ $t('admin.catalog_installed_version', { version: slotProps.data.installedVersion }) }}
          </small>
        </template>
      </Column>
      <Column :header="$t('admin.catalog_source')" :style="{ width: '12rem' }">
        <template #body="slotProps">{{ slotProps.data.source.name }}</template>
      </Column>
      <Column :header="$t('admin.status')" :style="{ width: '12rem' }">
        <template #body="slotProps">
          <Tag :severity="severity(slotProps.data)" :value="$t(`admin.catalog_status_${slotProps.data.status}`)" />
          <small v-if="!slotProps.data.compatible" class="block mt-1 p-error">
            {{ $t('admin.catalog_incompatible', { api: slotProps.data.unicoreApi }) }}
          </small>
        </template>
      </Column>
      <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
        <template #body="slotProps">
          <Button
            v-if="canManage"
            :label="$t(actionLabel(slotProps.data))"
            :icon="slotProps.data.status === 'new' ? 'pi pi-download' : 'pi pi-sync'"
            class="p-button-text"
            :class="slotProps.data.status === 'update' ? 'p-button-success' : ''"
            :disabled="loading || !slotProps.data.compatible"
            :loading="installing === key(slotProps.data)"
            @click="install(slotProps.data)"
          />
        </template>
      </Column>
    </DataTable>

    <Message v-for="source in failed" :key="source.id" severity="warn" :closable="false" class="mt-3">
      {{ $t('admin.catalog_source_error', { source: source.name, error: source.error }) }}
    </Message>

    <Dialog v-model:visible="urlDialog" modal :header="$t('admin.catalog_by_url_title')" :style="{ width: '520px' }" class="p-fluid">
      <p class="mt-0 mb-3 text-color-secondary">{{ $t('admin.catalog_by_url_hint') }}</p>
      <div class="field">
        <label>{{ $t('admin.catalog_url') }}</label>
        <InputText v-model="url.url" placeholder="https://" />
      </div>
      <div class="field">
        <label>{{ $t('admin.catalog_token') }}</label>
        <Password v-model="url.token" :feedback="false" toggleMask />
        <small class="text-color-secondary">{{ $t('admin.catalog_token_once_hint') }}</small>
      </div>
      <template #footer>
        <Button :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" :disabled="urlLoading" @click="urlDialog = false" />
        <Button
          :label="$t('admin.extension_install_button')"
          icon="pi pi-check"
          class="p-button-text"
          :loading="urlLoading"
          :disabled="!url.url"
          @click="installFromUrl"
        />
      </template>
    </Dialog>

    <ExtensionSources v-model:visible="sourcesDialog" :kind="kind" @changed="load(true)" />
  </div>
</template>

<script>
import { useToast } from 'primevue/usetoast'

const STEP_KEYS = ['enable', 'rebuild', 'restart']

export default {
  props: {
    kind: { type: String, required: true },
    canManage: { type: Boolean, default: false },
  },
  emits: ['installed'],
  setup() {
    return { toast: useToast(), locale: useLocale() }
  },
  data() {
    return {
      entries: [],
      sources: [],
      loading: false,
      installing: null,
      urlDialog: false,
      urlLoading: false,
      url: { url: '', token: '' },
      sourcesDialog: false,
    }
  },
  computed: {
    failed() {
      return this.sources.filter((source) => source.error)
    },
  },
  mounted() {
    this.load()
  },
  methods: {
    key(entry) {
      return `${entry.source.id}:${entry.id}`
    },
    localized(value) {
      if (!value) return ''
      if (typeof value === 'string') return value

      return value[this.locale] || value.ru || value.en || Object.values(value)[0] || ''
    },
    severity(entry) {
      if (!entry.compatible) return 'danger'
      if (entry.status === 'update') return 'success'
      if (entry.status === 'installed') return 'secondary'
      if (entry.status === 'ahead') return 'warning'

      return 'info'
    },
    actionLabel(entry) {
      if (entry.status === 'new') return 'admin.catalog_install'
      if (entry.status === 'update') return 'admin.catalog_update'

      return 'admin.catalog_reinstall'
    },
    steps(result) {
      const steps = STEP_KEYS.filter((step) => result.steps?.[step]).map((step) => this.$t(`admin.extension_step_${step}`))

      return steps.length ? this.$t('admin.extension_steps', { steps: steps.join(', ') }) : ''
    },
    async load(refresh = false) {
      this.loading = true

      const catalog = await this.$api
        .get('/admin/extensions/catalog', { params: { kind: this.kind, refresh: refresh ? 1 : undefined } })
        .then((res) => res.data)
        .catch(() => ({ entries: [], sources: [] }))

      this.entries = catalog.entries.map((entry) => ({ ...entry, key: this.key(entry) }))
      this.sources = catalog.sources
      this.loading = false
    },
    report(data) {
      this.toast.add({
        severity: 'success',
        summary: this.$t(`admin.extension_${data.previousVersion ? 'updated' : 'installed'}_${data.kind}`),
        detail: this.steps(data),
        life: 8000,
      })
      this.$emit('installed', data)
    },
    fail(error) {
      this.toast.add({
        severity: 'error',
        summary: this.$t('admin.extension_install_error'),
        detail: error.response?.data?.message || this.$t('common.unknown_error'),
        life: 8000,
      })
    },
    async install(entry) {
      this.installing = this.key(entry)

      try {
        const { data } = await this.$api.post('/admin/extensions/catalog/install', {
          kind: entry.kind,
          id: entry.id,
          sourceId: entry.source.id,
        })

        this.report(data)
        await this.load()
      } catch (error) {
        this.fail(error)
      }

      this.installing = null
    },
    async installFromUrl() {
      this.urlLoading = true

      try {
        const { data } = await this.$api.post('/admin/extensions/url', { url: this.url.url, token: this.url.token || undefined })

        this.urlDialog = false
        this.url = { url: '', token: '' }
        this.report(data)
        await this.load()
      } catch (error) {
        this.fail(error)
      }

      this.urlLoading = false
    },
  },
}
</script>

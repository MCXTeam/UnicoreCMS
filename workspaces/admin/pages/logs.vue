<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <DataTable
          :value="logs.data"
          lazy
          paginator
          :rows="logs.meta.itemsPerPage"
          dataKey="id"
          :totalRecords="logs.meta.totalItems"
          :loading="loading"
          :rowsPerPageOptions="[25, 50, 100]"
          @page="onPage($event)"
          @sort="onSort($event)"
          responsiveLayout="scroll"
        >
          <template #header>
            <div class="flex flex-column gap-3">
              <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <h5 class="m-0">{{ $t('admin.logs_title') }}</h5>
                <span class="block mt-2 md:mt-0 p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText @keydown.enter="load()" v-model="search" :placeholder="$t('admin.search')" />
                </span>
              </div>
              <div class="flex flex-column md:flex-row gap-2">
                <Select
                  v-model="filters.class"
                  :options="classOptions"
                  optionLabel="label"
                  optionValue="value"
                  :placeholder="$t('admin.logs_all_classes')"
                  showClear
                  class="w-full md:w-14rem"
                  @change="load()"
                />
                <Select
                  v-model="filters.action"
                  :options="actionOptions"
                  optionLabel="label"
                  optionValue="value"
                  :placeholder="$t('admin.logs_all_actions')"
                  filter
                  showClear
                  class="w-full md:w-20rem"
                  @change="load()"
                />
                <Select
                  v-model="filters.status"
                  :options="statusOptions"
                  optionLabel="label"
                  optionValue="value"
                  :placeholder="$t('admin.logs_all_statuses')"
                  showClear
                  class="w-full md:w-12rem"
                  @change="load()"
                />
              </div>
            </div>
          </template>

          <template #empty>{{ $t('admin.logs_empty') }}</template>

          <Column field="created" :header="$t('admin.date')" sortable :style="{ width: '12rem' }">
            <template #body="slotProps">{{ $moment(slotProps.data.created).format('DD.MM.YYYY HH:mm:ss') }}</template>
          </Column>
          <Column field="action" :header="$t('admin.logs_action')" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center gap-2">
                <i v-if="slotProps.data.status === 'failure'" class="pi pi-exclamation-triangle text-orange-500" />
                <span>{{ $t(`audit.action.${slotProps.data.action}`) }}</span>
              </div>
            </template>
          </Column>
          <Column field="class" :header="$t('admin.logs_class')" sortable :style="{ width: '11rem' }">
            <template #body="slotProps">
              <Tag :severity="classSeverity(slotProps.data.class)" :value="$t(`audit.class.${slotProps.data.class}`)" />
            </template>
          </Column>
          <Column field="actorName" :header="$t('admin.logs_actor')" sortable>
            <template #body="slotProps">
              <div class="flex flex-column">
                <span>{{ slotProps.data.actorName || $t(`audit.actor.${slotProps.data.actorType}`) }}</span>
                <small class="text-color-secondary">{{ slotProps.data.ip }}</small>
              </div>
            </template>
          </Column>
          <Column field="targetName" :header="$t('admin.logs_target')">
            <template #body="slotProps">
              <span v-if="slotProps.data.targetType">
                {{ slotProps.data.targetName || slotProps.data.targetId }}
              </span>
            </template>
          </Column>
          <Column field="client" :header="$t('admin.logs_client')" :style="{ width: '12rem' }"></Column>
          <Column :style="{ width: '4rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button
                v-if="hasDetails(slotProps.data)"
                icon="pi pi-search"
                class="p-button-rounded p-button-text"
                @click="openDetails(slotProps.data)"
              />
            </template>
          </Column>
        </DataTable>

        <small class="block mt-3 text-color-secondary">{{ $t('admin.logs_retention') }}</small>

        <Dialog v-model:visible="detailsDialog" :style="{ width: '520px' }" :modal="true" :header="$t('admin.logs_details')">
          <div v-if="selected" class="flex flex-column gap-3">
            <div class="flex justify-content-between">
              <span class="text-color-secondary">{{ $t('admin.logs_status') }}</span>
              <Tag :severity="selected.status === 'failure' ? 'danger' : 'success'" :value="$t(`audit.status.${selected.status}`)" />
            </div>
            <div v-if="selected.changes">
              <h6 class="mb-2">{{ $t('admin.logs_changes') }}</h6>
              <DataTable :value="changeRows(selected.changes)" size="small">
                <Column field="field" :header="$t('admin.logs_action')"></Column>
                <Column field="before" :header="$t('admin.logs_before')"></Column>
                <Column field="after" :header="$t('admin.logs_after')"></Column>
              </DataTable>
            </div>
            <div v-if="selected.meta">
              <h6 class="mb-2">{{ $t('admin.logs_details') }}</h6>
              <div v-for="(value, key) in selected.meta" :key="key" class="flex justify-content-between py-1">
                <span class="text-color-secondary">{{ metaLabel(key) }}</span>
                <span>{{ metaValue(key, value) }}</span>
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  </div>
</template>
<script>
import { sortTransform } from '~/helpers'

const CLASS_SEVERITY = {
  access: 'info',
  finance: 'warning',
  admin: 'danger',
  content: 'secondary',
}

const STATUSES = ['success', 'failure']

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.logs_title')) })

    return {}
  },
  data() {
    return {
      logs: {
        data: [],
        meta: {
          itemsPerPage: 25,
          totalItems: 0,
          currentPage: 1,
          sortBy: null,
        },
      },
      classes: [],
      actions: [],
      search: null,
      filters: {
        class: null,
        action: null,
        status: null,
      },
      loading: true,
      detailsDialog: false,
      selected: null,
    }
  },
  computed: {
    classOptions() {
      return this.classes.map((value) => ({ value, label: this.$t(`audit.class.${value}`) }))
    },
    actionOptions() {
      return this.actions
        .filter((entry) => !this.filters.class || entry.class === this.filters.class)
        .map((entry) => ({ value: entry.key, label: this.$t(`audit.action.${entry.key}`) }))
    },
    statusOptions() {
      return STATUSES.map((value) => ({ value, label: this.$t(`audit.status.${value}`) }))
    },
  },
  async mounted() {
    const [classes, actions] = await Promise.all([
      this.$api.get('/admin/logs/classes').then((res) => res.data),
      this.$api.get('/admin/logs/actions').then((res) => res.data),
    ])

    this.classes = classes
    this.actions = actions

    await this.load()
  },
  methods: {
    classSeverity(value) {
      return CLASS_SEVERITY[value] ?? 'secondary'
    },
    hasDetails(log) {
      return Boolean(log.changes || log.meta || log.status === 'failure')
    },
    openDetails(log) {
      this.selected = log
      this.detailsDialog = true
    },
    changeRows(changes) {
      return Object.entries(changes).map(([field, [before, after]]) => ({
        field,
        before: this.plain(before),
        after: this.plain(after),
      }))
    },
    plain(value) {
      if (value === null || value === undefined) return '—'
      if (Array.isArray(value)) return value.join(', ')
      if (typeof value === 'object') return JSON.stringify(value)

      return String(value)
    },
    translated(key, fallback) {
      const value = this.$t(key)

      return value === key ? fallback : value
    },
    metaLabel(key) {
      return this.translated(`audit.meta.${key}`, key)
    },
    metaValue(key, value) {
      if (key === 'reason') return this.translated(`audit.reason.${value}`, value)
      if (typeof value === 'boolean') return this.$t(value ? 'admin.yes' : 'admin.no')

      return this.plain(value)
    },
    params() {
      const params = {
        page: this.logs.meta.currentPage,
        limit: this.logs.meta.itemsPerPage,
        search: this.search,
        sortBy: this.logs.meta.sortBy,
      }

      for (const [field, value] of Object.entries(this.filters)) if (value) params[`filter[${field}]`] = `$eq:${value}`

      return params
    },
    async load() {
      this.loading = true

      this.logs = await this.$api.get('/admin/logs', { params: this.params() }).then((res) => res.data)
      this.loading = false
    },
    onPage(event) {
      this.logs.meta.currentPage = event.page + 1
      this.logs.meta.itemsPerPage = event.rows
      this.load()
    },
    onSort(event) {
      this.logs.meta.sortBy = sortTransform(event.sortOrder, event.sortField)
      this.load()
    },
  },
}
</script>

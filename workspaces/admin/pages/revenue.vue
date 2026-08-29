<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-4 gap-3">
          <h5 class="m-0">{{ $t('admin.revenue_title') }}</h5>
          <div class="flex flex-column sm:flex-row gap-2">
            <DatePicker v-model="range.from" dateFormat="dd.mm.yy" :placeholder="$t('admin.date_from')" showIcon />
            <DatePicker v-model="range.to" dateFormat="dd.mm.yy" :placeholder="$t('admin.date_to')" showIcon />
            <Button :label="$t('admin.apply')" icon="pi pi-search" @click="load()" />
          </div>
        </div>

        <DataTable :value="report.rows" :loading="loading" responsiveLayout="scroll" dataKey="server">
          <template #empty>
            <div class="text-center p-4 text-color-secondary">{{ $t('admin.revenue_empty') }}</div>
          </template>
          <Column field="name" :header="$t('cabinet.server')" sortable>
            <template #body="slotProps">{{ slotProps.data.name || $t('admin.revenue_no_server') }}</template>
          </Column>
          <Column field="real" :header="$t('admin.revenue_real')" sortable>
            <template #body="slotProps">{{ $utils.formatCurrency('real', slotProps.data.real) }}</template>
          </Column>
          <Column field="virtual" :header="$t('admin.revenue_virtual')" sortable>
            <template #body="slotProps">{{ $utils.formatCurrency('virtual', slotProps.data.virtual) }}</template>
          </Column>
          <Column field="purchases" :header="$t('admin.revenue_purchases')" sortable />
          <Column field="products" :header="$t('admin.menu_catalog')" sortable />
          <Column field="kits" :header="$t('admin.menu_kits')" sortable />
          <Column field="groups" :header="$t('admin.menu_donate_groups')" sortable />
          <Column field="permissions" :header="$t('admin.menu_donate_permissions')" sortable />
          <ColumnGroup type="footer">
            <Row>
              <Column :footer="$t('admin.revenue_total')" />
              <Column :footer="$utils.formatCurrency('real', report.total.real)" />
              <Column :footer="$utils.formatCurrency('virtual', report.total.virtual)" />
              <Column :footer="String(report.total.purchases)" />
              <Column :footer="String(report.total.products)" />
              <Column :footer="String(report.total.kits)" />
              <Column :footer="String(report.total.groups)" />
              <Column :footer="String(report.total.permissions)" />
            </Row>
          </ColumnGroup>
        </DataTable>

        <div class="mt-5">
          <h5 class="m-0 mb-3">{{ $t('admin.revenue_items_title') }}</h5>
          <DataTable :value="items" :loading="loading" responsiveLayout="scroll" dataKey="name">
            <template #empty>
              <div class="text-center p-4 text-color-secondary">{{ $t('admin.revenue_items_empty') }}</div>
            </template>
            <Column field="name" :header="$t('admin.revenue_item_name')" sortable></Column>
            <Column field="typeLabel" :header="$t('admin.type')" sortable />
            <Column field="server" :header="$t('cabinet.server')" sortable>
              <template #body="slotProps">{{ slotProps.data.server || $t('admin.revenue_no_server') }}</template>
            </Column>
            <Column field="count" :header="$t('admin.revenue_items_count')" sortable />
            <Column field="real" :header="$t('admin.revenue_real')" sortable>
              <template #body="slotProps">{{ $utils.formatCurrency('real', slotProps.data.real) }}</template>
            </Column>
            <Column field="virtual" :header="$t('admin.revenue_virtual')" sortable>
              <template #body="slotProps">{{ $utils.formatCurrency('virtual', slotProps.data.virtual) }}</template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.revenue_title')) })
  },

  data() {
    return {
      loading: false,
      range: {
        from: null,
        to: null,
      },
      report: {
        rows: [],
        total: { real: 0, virtual: 0, purchases: 0, products: 0, kits: 0, groups: 0, permissions: 0 },
      },
      items: [],
    }
  },

  mounted() {
    this.load()
  },

  methods: {
    async load() {
      this.loading = true

      try {
        const params = {}

        if (this.range.from) params.from = this.$moment(this.range.from).format('YYYY-MM-DD')
        if (this.range.to) params.to = this.$moment(this.range.to).format('YYYY-MM-DD')

        const [report, items] = await Promise.all([
          this.$api.get('/admin/dashboard/revenue', { params }).then((res) => res.data),
          this.$api.get('/admin/dashboard/revenue/items', { params }).then((res) => res.data),
        ])

        this.report = report
        this.items = items.map((item) => ({ ...item, typeLabel: this.$t(`admin.revenue_type_${item.type}`) }))
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

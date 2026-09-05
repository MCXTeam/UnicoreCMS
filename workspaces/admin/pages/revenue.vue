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

        <DataTable v-if="canRevenue" :value="report.rows" :loading="loading" responsiveLayout="scroll" dataKey="server">
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

        <div v-if="canItems" class="mt-5">
          <h5 class="m-0 mb-3">{{ $t('admin.revenue_items_title') }}</h5>
          <DataTable :value="items" :loading="loading" responsiveLayout="scroll" dataKey="key">
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

        <div v-if="canPayments" class="mt-5">
          <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-3 gap-2">
            <h5 class="m-0">{{ $t('admin.payments_title') }}</h5>
            <div class="flex flex-wrap align-items-center gap-2">
              <Select
                v-model="paymentStatus"
                :options="paymentStatuses"
                optionLabel="label"
                optionValue="value"
                :placeholder="$t('admin.payments_status')"
                showClear
                class="w-12rem"
                @change="loadPayments()"
              />
              <Button
                v-if="canCreatePayment"
                :label="$t('admin.payments_create')"
                icon="pi pi-plus"
                class="p-button-success flex-shrink-0 white-space-nowrap"
                @click="openPaymentDialog()"
              />
            </div>
          </div>

          <DataTable
            :value="payments.data"
            :loading="paymentsLoading"
            lazy
            paginator
            dataKey="id"
            :rows="payments.meta.itemsPerPage"
            :totalRecords="payments.meta.totalItems"
            :rowsPerPageOptions="[25, 50, 100]"
            responsiveLayout="scroll"
            @page="onPaymentsPage($event)"
          >
            <template #empty>
              <div class="text-center p-4 text-color-secondary">{{ $t('admin.payments_empty') }}</div>
            </template>
            <Column field="created" :header="$t('admin.date')" :style="{ width: '12rem' }">
              <template #body="slotProps">{{ $moment(slotProps.data.created).format('DD.MM.YYYY HH:mm') }}</template>
            </Column>
            <Column field="user" :header="$t('admin.player')">
              <template #body="slotProps">{{ slotProps.data.user?.username || '—' }}</template>
            </Column>
            <Column field="amount" :header="$t('admin.amount')">
              <template #body="slotProps">{{ $utils.formatCurrency('real', slotProps.data.amount) }}</template>
            </Column>
            <Column field="method" :header="$t('admin.payments_method')">
              <template #body="slotProps">{{ methodLabel(slotProps.data.method) }}</template>
            </Column>
            <Column field="status" :header="$t('admin.payments_status')" :style="{ width: '10rem' }">
              <template #body="slotProps">
                <Tag
                  :severity="slotProps.data.status === 'paid' ? 'success' : 'warn'"
                  :value="$t(`admin.payments_status_${slotProps.data.status}`)"
                />
              </template>
            </Column>
            <Column v-if="canCreatePayment" :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
              <template #body="slotProps">
                <Button
                  v-if="slotProps.data.status !== 'paid'"
                  :label="$t('admin.payments_complete')"
                  icon="pi pi-check"
                  size="small"
                  :disabled="paymentsLoading"
                  @click="completePayment(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>

          <h5 class="mt-5 mb-3">{{ $t('admin.payments_top_title') }}</h5>
          <DataTable :value="paymentsTop" :loading="paymentsLoading" responsiveLayout="scroll" dataKey="uuid">
            <template #empty>
              <div class="text-center p-4 text-color-secondary">{{ $t('admin.payments_top_empty') }}</div>
            </template>
            <Column field="username" :header="$t('admin.player')" sortable />
            <Column field="total" :header="$t('admin.payments_total')" sortable>
              <template #body="slotProps">{{ $utils.formatCurrency('real', slotProps.data.total) }}</template>
            </Column>
            <Column field="payments" :header="$t('admin.payments_count')" sortable />
          </DataTable>
        </div>

        <Dialog
          v-model:visible="paymentDialog"
          :style="{ width: '460px' }"
          :modal="true"
          :header="$t('admin.payments_dialog')"
          class="p-fluid"
        >
          <div class="field">
            <label>{{ $t('admin.player') }}<span class="p-error"> *</span></label>
            <AutoComplete
              v-model="payment.user"
              :suggestions="players"
              @complete="searchPlayer($event)"
              optionLabel="username"
              forceSelection
              dropdown
            />
          </div>
          <div class="field">
            <label>{{ $t('admin.amount') }}<span class="p-error"> *</span></label>
            <InputNumber
              v-model="payment.amount"
              mode="decimal"
              :min="0"
              :minFractionDigits="realDecimals"
              :maxFractionDigits="realDecimals"
            />
          </div>
          <div class="field">
            <label>{{ $t('admin.payments_method') }}</label>
            <Select
              v-model="payment.method"
              :options="methodOptions"
              optionLabel="label"
              optionValue="value"
              :placeholder="$t('admin.payments_method_manual')"
              showClear
            />
          </div>
          <div class="field-checkbox">
            <Checkbox :binary="true" v-model="payment.paid" inputId="payment-paid" />
            <label for="payment-paid" class="flex align-items-center gap-1">
              {{ $t('admin.payments_paid') }}
              <i v-tooltip.right="$t('admin.payments_paid_hint')" class="pi pi-question-circle text-color-secondary" />
            </label>
          </div>
          <template #footer>
            <Button :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="paymentDialog = false" />
            <Button
              :label="$t('common.save')"
              icon="pi pi-check"
              class="p-button-text"
              :disabled="paymentsLoading || !payment.user || !payment.amount"
              @click="createPayment()"
            />
          </template>
        </Dialog>
      </div>
    </div>
  </div>
</template>

<script>
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { MANUAL_PAYMENT_METHOD, PAYMENT_STATUSES } from 'unicore-common/payments'

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.revenue_title')) })

    const access = useAccess({
      canRevenue: 'panel.revenue.read',
      canItems: 'panel.revenue.items',
      canPayments: 'panel.revenue.payments',
      canCreatePayment: 'panel.revenue.payments.create',
    })

    return {
      ...access,
      toast: useToast(),
      confirm: useConfirm(),
      realDecimals: useRuntimeConfig().public.realDecimals,
    }
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
      payments: { data: [], meta: { itemsPerPage: 25, totalItems: 0, currentPage: 1 } },
      paymentsTop: [],
      paymentsLoading: false,
      paymentStatus: null,
      paymentDialog: false,
      payment: { user: null, amount: null, method: null, paid: false },
      players: [],
      methods: [],
    }
  },

  computed: {
    paymentStatuses() {
      return PAYMENT_STATUSES.map((value) => ({ value, label: this.$t(`admin.payments_status_${value}`) }))
    },
    methodOptions() {
      return this.methods.map((value) => ({ value, label: value }))
    },
  },

  mounted() {
    this.load()

    if (this.canPayments) this.loadPayments()
  },

  methods: {
    async load() {
      this.loading = true

      try {
        const params = {}

        if (this.range.from) params.from = this.$moment(this.range.from).format('YYYY-MM-DD')
        if (this.range.to) params.to = this.$moment(this.range.to).format('YYYY-MM-DD')

        const [report, items] = await Promise.all([
          this.canRevenue ? this.$api.get('/admin/dashboard/revenue', { params }).then((res) => res.data) : this.report,
          this.canItems ? this.$api.get('/admin/dashboard/revenue/items', { params }).then((res) => res.data) : [],
        ])

        this.report = report
        this.items = items.map((item, index) => ({
          ...item,
          key: `${item.type}:${item.server ?? ''}:${item.name ?? ''}:${index}`,
          typeLabel: this.$t(`admin.revenue_type_${item.type}`),
        }))
      } finally {
        this.loading = false
      }
    },

    methodLabel(method) {
      return method === MANUAL_PAYMENT_METHOD ? this.$t('admin.payments_method_manual') : method
    },

    async loadPayments() {
      this.paymentsLoading = true

      try {
        const params = {
          page: this.payments.meta.currentPage,
          limit: this.payments.meta.itemsPerPage,
        }

        if (this.paymentStatus) params['filter[status]'] = `$eq:${this.paymentStatus}`

        const [list, top, methods] = await Promise.all([
          this.$api.get('/admin/payments', { params }).then((res) => res.data),
          this.$api.get('/admin/payments/top').then((res) => res.data),
          this.methods.length ? Promise.resolve(this.methods) : this.$api.get('/payment/methods').then((res) => res.data),
        ])

        this.payments = list
        this.paymentsTop = top
        this.methods = methods || []
      } catch {
        this.paymentsTop = []
      } finally {
        this.paymentsLoading = false
      }
    },

    onPaymentsPage(event) {
      this.payments.meta.currentPage = event.page + 1
      this.payments.meta.itemsPerPage = event.rows
      this.loadPayments()
    },

    completePayment(payment) {
      this.confirm.require({
        message: this.$t('admin.payments_complete_confirm'),
        header: this.$t('admin.payments_complete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.paymentsLoading = true

          const ok = await this.$api
            .patch(`/admin/payments/${payment.id}`, { status: 'paid' })
            .then(() => true)
            .catch((error) => {
              this.$utils.notifyError(error, this.$t('admin.invalid_data'))

              return false
            })

          this.paymentsLoading = false

          if (!ok) return

          this.toast.add({ severity: 'success', detail: this.$t('admin.payments_completed'), life: 3000 })

          await this.loadPayments()
          await this.load()
        },
      })
    },

    openPaymentDialog() {
      this.payment = { user: null, amount: null, method: null, paid: false }
      this.paymentDialog = true
    },

    async searchPlayer(event) {
      this.players = await this.$api
        .get('/admin/payments/players', { params: { search: event.query.trim() } })
        .then((res) => res.data)
        .catch(() => [])
    },

    async createPayment() {
      this.paymentsLoading = true

      const ok = await this.$api
        .post('/admin/payments', {
          username: this.payment.user?.username,
          amount: this.payment.amount,
          method: this.payment.method || undefined,
          paid: this.payment.paid,
        })
        .then(() => true)
        .catch((error) => {
          this.$utils.notifyError(error, this.$t('admin.invalid_data'))

          return false
        })

      this.paymentsLoading = false

      if (!ok) return

      this.paymentDialog = false
      this.toast.add({ severity: 'success', detail: this.$t('admin.payments_created'), life: 3000 })

      await this.loadPayments()
      await this.load()
    },
  },
}
</script>

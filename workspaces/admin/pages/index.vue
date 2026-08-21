<template>
  <div class="grid">
    <div class="col-12">
      <div class="grid grid-nogutter surface-section text-800">
        <div class="col-12 md:col-6 p-6 text-center md:text-left flex align-items-center">
          <section>
            <span class="block text-6xl font-bold mb-1">UnicoreCMS</span>
            <div class="text-6xl text-primary font-bold mb-3">{{ $t('admin.home_title') }}</div>
            <p class="mt-0 mb-4 text-700 line-height-3">{{ $t('admin.home_text') }}</p>
            <a href="https://docs.unicorecms.ru/" target="_blank">
              <Button :label="$t('admin.docs')" type="button" class="mr-3 p-button-raised"></Button>
            </a>
          </section>
        </div>
      </div>
    </div>
    <div v-if="hasSection('purchases')" class="col-12 lg:col-6 xl:col-3">
      <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
          <div>
            <span class="block text-500 font-medium mb-3">{{ $t('admin.stat_purchases') }}</span>
            <div class="text-900 font-medium text-xl">
              {{ $_.get(stats, 'purchases.count', '...') }}
            </div>
          </div>
          <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width: 2.5rem; height: 2.5rem">
            <i class="pi pi-shopping-cart text-blue-500 text-xl"></i>
          </div>
        </div>
        <span class="text-green-500 font-medium">+{{ $_.get(stats, 'purchases.days[6].count', '...') }}</span>
        <span class="text-500">{{ $t('admin.today') }}</span>
      </div>
    </div>
    <div v-if="hasSection('payments')" class="col-12 lg:col-6 xl:col-3">
      <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
          <div>
            <span class="block text-500 font-medium mb-3">{{ $t('admin.stat_income') }}</span>
            <div class="text-900 font-medium text-xl">
              {{ $utils.formatCurrency('real', $_.get(stats, 'payments.amount', 0)) }}
            </div>
          </div>
          <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width: 2.5rem; height: 2.5rem">
            <i class="pi pi-wallet text-orange-500 text-xl"></i>
          </div>
        </div>
        <span class="text-green-500 font-medium">+{{ $utils.formatCurrency('real', $_.get(stats, 'payments.months[11].amount', 0)) }}</span>
        <span class="text-500">{{ $t('admin.this_month') }}</span>
      </div>
    </div>
    <div v-if="hasSection('users')" class="col-12 lg:col-6 xl:col-3">
      <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
          <div>
            <span class="block text-500 font-medium mb-3">{{ $t('admin.menu_users') }}</span>
            <div class="text-900 font-medium text-xl">
              {{ $_.get(stats, 'users.count', '...') }}
            </div>
          </div>
          <div class="flex align-items-center justify-content-center bg-cyan-100 border-round" style="width: 2.5rem; height: 2.5rem">
            <i class="pi pi-users text-cyan-500 text-xl"></i>
          </div>
        </div>
        <span class="text-green-500 font-medium">+{{ $_.get(stats, 'users.days[6].count', '...') }}</span>
        <span class="text-500">{{ $t('admin.today') }}</span>
      </div>
    </div>
    <div v-if="hasSection('online_records')" class="col-12 lg:col-6 xl:col-3">
      <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
          <div>
            <span class="block text-500 font-medium mb-3">{{ $t('admin.stat_record_online') }}</span>
            <div class="text-900 font-medium text-xl">
              {{ $_.get(stats, 'online_records.amount', '...') }}
            </div>
          </div>
          <div class="flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 2.5rem; height: 2.5rem">
            <i class="pi pi-play text-purple-500 text-xl"></i>
          </div>
        </div>
        <span class="text-green-500 font-medium">{{ $_.get(stats, 'online_records.days[6].amount', '...') }} </span>
        <span class="text-500">{{ $t('admin.today') }}</span>
      </div>
    </div>
    <div v-if="hasSection('payments')" class="col-12 xl:col-6 mt-2">
      <div class="card h-full">
        <h5>{{ $t('admin.income_7_days') }}</h5>
        <DataTable
          :value="$_.orderBy($_.get(stats, 'payments.days', []), ['date'], ['desc'])"
          :loading="!$_.get(stats, 'payments.days')"
          responsiveLayout="scroll"
        >
          <Column field="date" :header="$t('common.date')" style="width: 35%">
            <template #body="slotProps">
              {{ $moment(slotProps.data.date).format('DD.MM.YYYY (dddd)') }}
    <ExtensionSlot name="dashboard" />
            </template>
          </Column>
          <Column field="amount" :header="$t('admin.stat_income')" style="width: 35%">
            <template #body="slotProps">
              <span v-if="slotProps.data.amount > 0" class="text-green-500">
                +{{ $utils.formatCurrency('real', slotProps.data.amount) }}
              </span>
              <span v-else>
                {{ $utils.formatCurrency('real', slotProps.data.amount) }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
    <div v-if="chartSections.length" class="col-12 xl:col-6 mt-2">
      <div class="card h-full">
        <div class="flex justify-content-between align-items-center mb-5">
          <h5>{{ $t('admin.statistics') }}</h5>
          <SelectButton v-model="chartPeriod" :options="chartPeriods" optionLabel="label" optionValue="value" :allowEmpty="false" />
        </div>
        <Chart type="bar" :data="barData" :options="barOptions" />
      </div>
    </div>
    <div class="col-12 mt-2">
      <div class="card h-full">
        <div class="flex justify-content-between align-items-center mb-4">
          <h5>{{ $t('admin.servers_status') }}</h5>
        </div>
        <ul class="list-none p-0 m-0">
          <li
            v-for="online in onlines.servers"
            :key="online.server.id"
            class="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-4"
          >
            <div>
              <span class="text-900 font-medium mr-2 mb-1 md:mb-0" v-text="online.server.name" />
              <div v-if="online.online" class="mt-1 text-600">
                {{ online.players }}/{{ online.maxplayers }},
                {{ $t('admin.record_line', { record: online.record, today: online.record_today }) }}
              </div>
              <div v-else class="mt-1 text-600">
                {{ $t('panel.offline') }}, {{ $t('admin.record_line', { record: online.record, today: online.record_today }) }}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from 'primevue/chart'
import { DASHBOARD_CHART_SECTIONS } from '~/constants'
import { useIoStore } from '~/stores/io'
import { useLocale } from '~/composables/useLocale'

export default {
  components: { Chart },
  setup() {
    const ioStore = useIoStore()

    return { ioStore, locale: useLocale() }
  },
  data() {
    return {
      products: null,
      stats: null,
      chartPeriod: 'week',
      barData: {
        labels: [],
        datasets: [],
      },
      barOptions: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    }
  },
  watch: {
    chartPeriod() {
      if (this.stats) this.buildChart()
    },
    locale() {
      if (this.stats) this.buildChart()
    },
  },

  computed: {
    onlines() {
      return this.ioStore.serversOnline
    },
    chartSections() {
      return DASHBOARD_CHART_SECTIONS.filter((section) => this.hasSection(section.key))
    },
    chartPeriods() {
      return [
        { label: this.$t('admin.period_week'), value: 'week' },
        { label: this.$t('admin.period_month'), value: 'month' },
        { label: this.$t('admin.period_year'), value: 'year' },
      ]
    },
  },
  async mounted() {
    this.stats = await this.$api.get('/admin/dashboard/stats').then((res) => res.data)
    this.buildChart()

    this.$socket.emit('servers/online', {}, (res) => {
      this.ioStore.setServersOnline(res)
    })
  },
  methods: {
    hasSection(section) {
      return !!this.$_.get(this.stats, section)
    },
    buildChart() {
      const periods = {
        week: { unit: 'day', back: 6, format: 'dddd', key: 'days' },
        month: { unit: 'day', back: 29, format: 'D MMMM', key: 'month' },
        year: { unit: 'month', back: 11, format: 'MMMM', key: 'months' },
      }
      const { unit, back, format, key } = periods[this.chartPeriod]
      const start = this.$moment().subtract(back, unit).startOf(unit)
      const range = Array.from(this.$moment.range(start, this.$moment()).by(unit))

      this.barData.labels = range.map((r) => r.format(format))
      this.barData.datasets = this.chartSections.map((section) => ({
        label: this.$t(section.label),
        data: this.stats[section.key][key].map((stat) => stat[section.field]),
        backgroundColor: section.color,
      }))
    },
  },
}
</script>

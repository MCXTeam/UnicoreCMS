<template>
  <div class="grid">
    <div class="col-12">
      <div class="grid grid-nogutter surface-section text-800">
        <div class="col-12 md:col-6 p-6 text-center md:text-left flex align-items-center">
          <section>
            <span class="block text-6xl font-bold mb-1">UnicoreCMS</span>
            <div class="text-6xl text-primary font-bold mb-3">Headless CMS для Minecraft</div>
            <p class="mt-0 mb-4 text-700 line-height-3">
              CMS для модовых проектов Minecraft. Современные технологии и профессиональный подход, невероятная производительность и скорость.
            </p>
            <a href="https://unicorecms.ru/docs" target="_blank">
              <Button label="Документация" type="button" class="mr-3 p-button-raised"></Button>
            </a>
          </section>
        </div>
      </div>
    </div>
    <div class="col-12 lg:col-6 xl:col-3">
      <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
          <div>
            <span class="block text-500 font-medium mb-3">Покупки</span>
            <div class="text-900 font-medium text-xl">
              {{ $_.get(stats, 'purchases.count', '...') }}
            </div>
          </div>
          <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width: 2.5rem; height: 2.5rem">
            <i class="pi pi-shopping-cart text-blue-500 text-xl"></i>
          </div>
        </div>
        <span class="text-green-500 font-medium">+{{ $_.get(stats, 'purchases.days[6].count', '...') }}</span>
        <span class="text-500">сегодня</span>
      </div>
    </div>
    <div class="col-12 lg:col-6 xl:col-3">
      <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
          <div>
            <span class="block text-500 font-medium mb-3">Доход</span>
            <div class="text-900 font-medium text-xl">
              {{ $utils.formatCurrency('real', $_.get(stats, 'payments.amount', 0)) }}
            </div>
          </div>
          <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width: 2.5rem; height: 2.5rem">
            <i class="pi pi-wallet text-orange-500 text-xl"></i>
          </div>
        </div>
        <span class="text-green-500 font-medium">+{{ $utils.formatCurrency('real', $_.get(stats, 'payments.months[11].amount', 0)) }}</span>
        <span class="text-500">в этом месяце</span>
      </div>
    </div>
    <div class="col-12 lg:col-6 xl:col-3">
      <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
          <div>
            <span class="block text-500 font-medium mb-3">Пользователи</span>
            <div class="text-900 font-medium text-xl">
              {{ $_.get(stats, 'users.count', '...') }}
            </div>
          </div>
          <div class="flex align-items-center justify-content-center bg-cyan-100 border-round" style="width: 2.5rem; height: 2.5rem">
            <i class="pi pi-users text-cyan-500 text-xl"></i>
          </div>
        </div>
        <span class="text-green-500 font-medium">+{{ $_.get(stats, 'users.days[6].count', '...') }}</span>
        <span class="text-500">сегодня</span>
      </div>
    </div>
    <div class="col-12 lg:col-6 xl:col-3">
      <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
          <div>
            <span class="block text-500 font-medium mb-3">Рекордный онлайн</span>
            <div class="text-900 font-medium text-xl">
              {{ $_.get(stats, 'online_records.amount', '...') }}
            </div>
          </div>
          <div class="flex align-items-center justify-content-center bg-purple-100 border-round" style="width: 2.5rem; height: 2.5rem">
            <i class="pi pi-play text-purple-500 text-xl"></i>
          </div>
        </div>
        <span class="text-green-500 font-medium">{{ $_.get(stats, 'online_records.days[6].amount', '...') }} </span>
        <span class="text-500">сегодня</span>
      </div>
    </div>
    <div class="col-12 xl:col-6 mt-2">
      <div class="card h-full">
        <h5>Доход за последние 7 дней</h5>
        <DataTable
          :value="$_.reverse($_.get(stats, 'payments.days', []))"
          :loading="!$_.get(stats, 'payments.days')"
          responsiveLayout="scroll"
        >
          <Column field="date" header="Дата" style="width: 35%">
            <template #body="slotProps">
              {{ $moment(slotProps.data.date).local().format('DD.MM.YYYY (dddd)') }}
            </template>
          </Column>
          <Column field="amount" header="Доход" style="width: 35%">
            <template #body="slotProps">
              <span v-if="slotProps.data.amount > 0" class="text-green-500"> +{{ $utils.formatCurrency('real', slotProps.data.amount) }} </span>
              <span v-else>
                {{ $utils.formatCurrency('real', slotProps.data.amount) }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
    <div class="col-12 xl:col-6 mt-2">
      <div class="card h-full">
        <div class="flex justify-content-between align-items-center mb-5">
          <h5>Статистика</h5>
          <div>
            <Button
              icon="pi pi-ellipsis-v"
              class="p-button-text p-button-plain p-button-rounded"
              @click="$refs.menu2.toggle($event)"
            ></Button>
            <Menu ref="menu2" :popup="true" :model="charts"></Menu>
          </div>
        </div>
        <Chart type="bar" :data="barData" :options="barOptions" />
      </div>
    </div>
    <div class="col-12 mt-2">
      <div class="card h-full">
        <div class="flex justify-content-between align-items-center mb-4">
          <h5>Текущий статус серверов</h5>
        </div>
        <ul class="list-none p-0 m-0">
          <li v-for="online in onlines.servers" :key="online.server.id" class="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-4">
            <div>
              <span class="text-900 font-medium mr-2 mb-1 md:mb-0" v-text="online.server.name" />
              <div v-if="online.online" class="mt-1 text-600">{{ online.players }}/{{ online.maxplayers }}, рекорд: {{ online.record }}, cегодня {{ online.record_today }}</div>
              <div v-else class="mt-1 text-600">Оффлайн, рекорд: {{ online.record }}, cегодня {{ online.record_today }}</div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      products: null,
      stats: null,
      charts: [
        {
          label: 'Недельня',
          command: () => {
            this.daysCharts()
          },
        },
        {
          label: 'Годовая',
          command: () => {
            this.monthsCharts()
          },
        },
      ],
      barData: {
        labels: [],
        datasets: [],
      },
      barOptions: {
        scales: {
          scaleOverride: true,
          scaleStartValue: 0,
          y: {
            ticks: {
              precision: 0,
            },
          },
        },
      },
    }
  },
  async fetch() {
    this.stats = await this.$axios.get('/admin/dashboard/stats').then((res) => res.data)

    this.daysCharts()
  },
  computed: {
    ...mapGetters({
      onlines: 'io/serversOnline'
    }),
  },
  async mounted() {
    this.socket = this.$nuxtSocket({})
    this.socket.emit('servers/online', {}, (res) => {
      this.$store.commit('io/SERVERS_ONLINE', res)
    })
  },
  methods: {
    daysCharts() {
      const range = Array.from(
        this.$moment.range(this.$moment().subtract(6, 'day').startOf('day').local(), this.$moment().local()).by('day')
      )
      this.barData.labels = range.map((r) => r.format('dddd'))
      this.barData.datasets = []
      this.barData.datasets.push({
        label: 'Онлайн',
        data: this.stats.online_records.days.map((online) => online.amount),
        fill: false,
        backgroundColor: '#e91e63',
        tension: 1,
      })
      this.barData.datasets.push({
        label: 'Покупки',
        data: this.stats.purchases.days.map((online) => online.count),
        fill: false,
        backgroundColor: '#3f51b5',
        tension: 1,
      })
      this.barData.datasets.push({
        label: 'Пополнения',
        data: this.stats.payments.days.map((online) => online.count),
        fill: false,
        backgroundColor: '#f57c00',
        tension: 1,
      })
      this.barData.datasets.push({
        label: 'Регистрации',
        data: this.stats.users.days.map((online) => online.count),
        fill: false,
        backgroundColor: '#9c27b0',
        tension: 1,
      })
    },
    monthsCharts() {
      const range = Array.from(
        this.$moment.range(this.$moment().subtract(11, 'month').startOf('month').local(), this.$moment().local()).by('month')
      )
      this.barData.labels = range.map((r) => r.format('MMMM'))
      this.barData.datasets = []
      this.barData.datasets.push({
        label: 'Онлайн',
        data: this.stats.online_records.months.map((online) => online.amount),
        fill: false,
        backgroundColor: '#e91e63',
        tension: 1,
      })
      this.barData.datasets.push({
        label: 'Покупки',
        data: this.stats.purchases.months.map((online) => online.count),
        fill: false,
        backgroundColor: '#3f51b5',
        tension: 1,
      })
      this.barData.datasets.push({
        label: 'Пополнения',
        data: this.stats.payments.months.map((online) => online.count),
        fill: false,
        backgroundColor: '#f57c00',
        tension: 1,
      })
      this.barData.datasets.push({
        label: 'Регистрации',
        data: this.stats.users.months.map((online) => online.count),
        fill: false,
        backgroundColor: '#9c27b0',
        tension: 1,
      })
    },
  },
}
</script>

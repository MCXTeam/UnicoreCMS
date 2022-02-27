<template>
  <div class="grid">
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
              {{ formatCurrency($_.get(stats, 'payments.amount', 0)) }}
            </div>
          </div>
          <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width: 2.5rem; height: 2.5rem">
            <i class="pi pi-wallet text-orange-500 text-xl"></i>
          </div>
        </div>
        <span class="text-green-500 font-medium">+{{ formatCurrency($_.get(stats, 'payments.months[11].amount', 0)) }}</span>
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
              <span v-if="slotProps.data.amount > 0" class="text-green-500"> +{{ formatCurrency(slotProps.data.amount) }} </span>
              <span v-else>
                {{ formatCurrency(slotProps.data.amount) }}
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
    <div class="col-12 xl:col-6 mt-2">
      <div class="card h-full">
        <div class="flex justify-content-between align-items-center mb-5">
          <h5>Best Selling Products</h5>
          <div>
            <Button
              icon="pi pi-ellipsis-v"
              class="p-button-text p-button-plain p-button-rounded"
              @click="$refs.menu2.toggle($event)"
            ></Button>
            <!--Menu ref="menu2" :popup="true" :model="items"></Menu-->
          </div>
        </div>
        <ul class="list-none p-0 m-0">
          <li class="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-4">
            <div>
              <span class="text-900 font-medium mr-2 mb-1 md:mb-0">Space T-Shirt</span>
              <div class="mt-1 text-600">Clothing</div>
            </div>
            <div class="mt-2 md:mt-0 flex align-items-center">
              <div class="surface-300 border-round overflow-hidden w-10rem lg:w-6rem" style="height: 8px">
                <div class="bg-orange-500 h-full" style="width: 50%"></div>
              </div>
              <span class="text-orange-500 ml-3 font-medium">%50</span>
            </div>
          </li>
          <li class="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-4">
            <div>
              <span class="text-900 font-medium mr-2 mb-1 md:mb-0">Portal Sticker</span>
              <div class="mt-1 text-600">Accessories</div>
            </div>
            <div class="mt-2 md:mt-0 ml-0 md:ml-8 flex align-items-center">
              <div class="surface-300 border-round overflow-hidden w-10rem lg:w-6rem" style="height: 8px">
                <div class="bg-cyan-500 h-full" style="width: 16%"></div>
              </div>
              <span class="text-cyan-500 ml-3 font-medium">%16</span>
            </div>
          </li>
          <li class="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-4">
            <div>
              <span class="text-900 font-medium mr-2 mb-1 md:mb-0">Supernova Sticker</span>
              <div class="mt-1 text-600">Accessories</div>
            </div>
            <div class="mt-2 md:mt-0 ml-0 md:ml-8 flex align-items-center">
              <div class="surface-300 border-round overflow-hidden w-10rem lg:w-6rem" style="height: 8px">
                <div class="bg-pink-500 h-full" style="width: 67%"></div>
              </div>
              <span class="text-pink-500 ml-3 font-medium">%67</span>
            </div>
          </li>
          <li class="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-4">
            <div>
              <span class="text-900 font-medium mr-2 mb-1 md:mb-0">Wonders Notebook</span>
              <div class="mt-1 text-600">Office</div>
            </div>
            <div class="mt-2 md:mt-0 ml-0 md:ml-8 flex align-items-center">
              <div class="surface-300 border-round overflow-hidden w-10rem lg:w-6rem" style="height: 8px">
                <div class="bg-green-500 h-full" style="width: 35%"></div>
              </div>
              <span class="text-green-500 ml-3 font-medium">%35</span>
            </div>
          </li>
          <li class="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-4">
            <div>
              <span class="text-900 font-medium mr-2 mb-1 md:mb-0">Mat Black Case</span>
              <div class="mt-1 text-600">Accessories</div>
            </div>
            <div class="mt-2 md:mt-0 ml-0 md:ml-8 flex align-items-center">
              <div class="surface-300 border-round overflow-hidden w-10rem lg:w-6rem" style="height: 8px">
                <div class="bg-purple-500 h-full" style="width: 75%"></div>
              </div>
              <span class="text-purple-500 ml-3 font-medium">%75</span>
            </div>
          </li>
          <li class="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-4">
            <div>
              <span class="text-900 font-medium mr-2 mb-1 md:mb-0">Robots T-Shirt</span>
              <div class="mt-1 text-600">Clothing</div>
            </div>
            <div class="mt-2 md:mt-0 ml-0 md:ml-8 flex align-items-center">
              <div class="surface-300 border-round overflow-hidden w-10rem lg:w-6rem" style="height: 8px">
                <div class="bg-teal-500 h-full" style="width: 40%"></div>
              </div>
              <span class="text-teal-500 ml-3 font-medium">%40</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div class="col-12 xl:col-6 mt-2">
      <div class="card h-full">
        <div class="flex align-items-center justify-content-between mb-4">
          <h5>Notifications</h5>
          <div>
            <Button
              icon="pi pi-ellipsis-v"
              class="p-button-text p-button-plain p-button-rounded"
              @click="$refs.menu1.toggle($event)"
            ></Button>
            <Menu ref="menu1" :popup="true" :model="items"></Menu>
          </div>
        </div>

        <span class="block text-600 font-medium mb-3">TODAY</span>
        <ul class="p-0 mx-0 mt-0 mb-4 list-none">
          <li class="flex align-items-center py-2 border-bottom-1 surface-border">
            <div class="w-3rem h-3rem flex align-items-center justify-content-center bg-blue-100 border-circle mr-3 flex-shrink-0">
              <i class="pi pi-dollar text-xl text-blue-500"></i>
            </div>
            <span class="text-900 line-height-3"
              >Richard Jones
              <span class="text-700">has purchased a blue t-shirt for <span class="text-blue-500">79$</span></span>
            </span>
          </li>
          <li class="flex align-items-center py-2">
            <div class="w-3rem h-3rem flex align-items-center justify-content-center bg-orange-100 border-circle mr-3 flex-shrink-0">
              <i class="pi pi-download text-xl text-orange-500"></i>
            </div>
            <span class="text-700 line-height-3"
              >Your request for withdrawal of <span class="text-blue-500 font-medium">2500$</span> has been initiated.</span
            >
          </li>
        </ul>

        <span class="block text-600 font-medium mb-3">YESTERDAY</span>
        <ul class="p-0 m-0 list-none">
          <li class="flex align-items-center py-2 border-bottom-1 surface-border">
            <div class="w-3rem h-3rem flex align-items-center justify-content-center bg-blue-100 border-circle mr-3 flex-shrink-0">
              <i class="pi pi-dollar text-xl text-blue-500"></i>
            </div>
            <span class="text-900 line-height-3"
              >Keyser Wick
              <span class="text-700">has purchased a black jacket for <span class="text-blue-500">59$</span></span>
            </span>
          </li>
          <li class="flex align-items-center py-2 border-bottom-1 surface-border">
            <div class="w-3rem h-3rem flex align-items-center justify-content-center bg-pink-100 border-circle mr-3 flex-shrink-0">
              <i class="pi pi-question text-xl text-pink-500"></i>
            </div>
            <span class="text-900 line-height-3"
              >Jane Davis
              <span class="text-700">has posted a new questions about your product.</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
    <div class="col-12 mt-2">
      <div
        class="px-4 py-5 shadow-2 flex flex-column md:flex-row md:align-items-center justify-content-between mb-3"
        style="
          border-radius: 1rem;
          background: linear-gradient(0deg, rgba(0, 123, 255, 0.5), rgba(0, 123, 255, 0.5)),
            linear-gradient(92.54deg, #1c80cf 47.88%, #ffffff 100.01%);
        "
      >
        <div>
          <div class="text-blue-100 font-medium text-xl mt-2 mb-3">СДЕЛАЙТЕ СЛЕДУЮЩИЙ ШАГ</div>
          <div class="text-white font-medium text-5xl">Try PrimeBlocks</div>
        </div>
        <div class="mt-4 mr-auto md:mt-0 md:mr-0">
          <a
            href="https://www.primefaces.org/primeblocks-vue"
            class="p-button font-bold px-5 py-3 p-button-warning p-button-rounded p-button-raised"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
  themeChangeListener: null,
  async fetch() {
    this.stats = await this.$axios.get('/admin/dashboard/stats').then((res) => res.data)

    this.daysCharts()
  },
  methods: {
    formatCurrency(value) {
      return value.toLocaleString('ru-RU', {
        style: 'currency',
        currency: 'RUB',
      })
    },
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

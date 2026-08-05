<template>
  <div class="px-4">
    <div class="row justify-content-between">
      <div class="col-12 col-xl-7">
        <h2 class="mt-0 mb-4">Транзакции и покупки</h2>
      </div>
      <div class="col input-fw">
        <Select
          class="mb-4 w-100"
          placeholder="Тип операции"
          v-model="history_type"
          :options="typeOptions"
          optionLabel="label"
          optionValue="value"
        />
      </div>
    </div>
    <div class="position-relative">
      <DataTable
        class="no-overflow-table large-table"
        :key="history_type"
        :value="history.data"
        lazy
        :paginator="history.data.length > 0"
        :rows="history.meta.itemsPerPage"
        :totalRecords="history.meta.totalItems"
        :loading="loading"
        @page="onPage($event)"
      >
        <Column style="max-width: 200px" header="Дата">
          <template #body="{ data }"> {{ $moment(data.created).format('D MMMM YYYY, HH:mm:ss') }} </template>
        </Column>
        <Column v-if="history_type != 'payment'" header="IP">
          <template #body="{ data }"
            ><span v-if="data.ip"> {{ data.ip }} </span></template
          >
        </Column>

        <Column v-if="history_type == 'payment'" style="max-width: 6rem" header="ID платежа">
          <template #body="{ data }"
            ><span v-if="data.payment"> #{{ data.payment.id }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'payment'" header="Платёжная система">
          <template #body="{ data }"
            ><span v-if="data.payment"> {{ data.payment.method }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'payment'" header="Сумма">
          <template #body="{ data }"
            ><span v-if="data.payment"> {{ $utils.formatCurrency('real', data.payment.amount) }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'payment'" header="Статус">
          <template #body="{ data }"
            ><span v-if="data.payment"> {{ data.payment.status }} </span></template
          >
        </Column>

        <Column v-if="history_type == 'product_purchase'" header="Товар">
          <template #body="{ data }"
            ><span v-if="data.product"> {{ data.product.name }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'product_purchase'" header="Сервер">
          <template #body="{ data }">
            <NuxtLink v-if="data.server" :to="'/servers/' + data.server.id">{{ data.server.name }}</NuxtLink>
          </template>
        </Column>
        <Column v-if="history_type == 'product_purchase'" style="max-width: 6rem" header="Количество">
          <template #body="{ data }"
            ><span v-if="data.amount"> {{ data.amount }} шт. </span></template
          >
        </Column>

        <Column v-if="history_type == 'kit_purchase'" header="Кит">
          <template #body="{ data }"
            ><span v-if="data.kit"> {{ data.kit.name }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'kit_purchase'" header="Сервер">
          <template #body="{ data }">
            <NuxtLink v-if="data.server" :to="'/servers/' + data.server.id">{{ data.server.name }}</NuxtLink>
          </template>
        </Column>

        <Column v-if="history_type == 'donate_group_purchase'" header="Донат-группа">
          <template #body="{ data }"
            ><span v-if="data.donate_group"> {{ data.donate_group.name }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'donate_group_purchase'" header="Период">
          <template #body="{ data }"
            ><span v-if="data.period"> {{ data.period.name }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'donate_group_purchase'" header="Сервер">
          <template #body="{ data }">
            <NuxtLink v-if="data.server" :to="'/servers/' + data.server.id">{{ data.server.name }}</NuxtLink>
          </template>
        </Column>

        <Column v-if="history_type == 'donate_permission_purchase'" header="Донат-право">
          <template #body="{ data }"
            ><span v-if="data.donate_permission"> {{ data.donate_permission.name }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'donate_permission_purchase'" header="Период">
          <template #body="{ data }"
            ><span v-if="data.period"> {{ data.period.name }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'donate_permission_purchase'" header="Сервер">
          <template #body="{ data }">
            <NuxtLink v-if="data.server" :to="'/servers/' + data.server.id">{{ data.server.name }}</NuxtLink>
          </template>
        </Column>

        <Column v-if="history_type == 'money_exchange'" header="Сервер">
          <template #body="{ data }">
            <NuxtLink v-if="data.server" :to="'/servers/' + data.server.id">{{ data.server.name }}</NuxtLink>
          </template>
        </Column>
        <Column v-if="history_type == 'money_exchange'" header="Количество">
          <template #body="{ data }"
            ><span v-if="data.amount"> {{ $utils.formatCurrency('ingame', data.amount) }} </span></template
          >
        </Column>

        <Column v-if="history_type == 'money_transfer'" header="Игрок">
          <template #body="{ data }">
            <NuxtLink v-if="data.target" :to="`/user/` + data.target.username">{{ data.target.username }}</NuxtLink>
          </template>
        </Column>
        <Column v-if="history_type == 'money_transfer'" header="Сервер">
          <template #body="{ data }">
            <NuxtLink v-if="data.server" :to="'/servers/' + data.server.id">{{ data.server.name }}</NuxtLink>
          </template>
        </Column>
        <Column v-if="history_type == 'money_transfer'" header="Количество">
          <template #body="{ data }"
            ><span v-if="data.amount"> {{ $utils.formatCurrency('ingame', data.amount) }} </span></template
          >
        </Column>

        <Column v-if="history_type == 'real_transfer'" header="Игрок">
          <template #body="{ data }">
            <NuxtLink v-if="data.target" :to="`/user/` + data.target.username">{{ data.target.username }}</NuxtLink>
          </template>
        </Column>
        <Column v-if="history_type == 'real_transfer'" header="Количество">
          <template #body="{ data }"
            ><span v-if="data.amount"> {{ $utils.formatCurrency('ingame', data.amount) }} </span></template
          >
        </Column>

        <template #empty>
          <span>История пуста...</span>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script>
definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'verify'],
  title: 'Личный кабинет',
})

export default {
  data() {
    return {
      loading: false,
      history_type: 'payment',
      typeOptions: [
        { label: 'Пополнение баланса', value: 'payment' },
        { label: 'Покупки в магазиине (товары)', value: 'product_purchase' },
        { label: 'Покупки в магазиине (киты)', value: 'kit_purchase' },
        { label: 'Покупки донат-групп', value: 'donate_group_purchase' },
        { label: 'Покупки донат-прав', value: 'donate_permission_purchase' },
        { label: 'Покупка монет', value: 'money_exchange' },
        { label: 'Перевод монет', value: 'money_transfer' },
        { label: 'Перевод реальной валюты', value: 'real_transfer' },
      ],
      history: {
        data: [],
        meta: {
          currentPage: 1,
          totalPages: 1,
          itemsPerPage: 10,
          totalItems: 0,
        },
      },
    }
  },

  mounted() {
    this.load()
  },

  methods: {
    async load() {
      this.loading = true

      this.history = await this.$api
        .get('/cabinet/history/me', {
          params: {
            page: this.history.meta.currentPage,
            'filter.type': '$eq:' + this.history_type,
          },
        })
        .then((res) => res.data)

      this.loading = false
    },

    onPage(event) {
      this.history.meta.currentPage = event.page + 1
      this.load()
    },
  },

  watch: {
    history_type: {
      handler() {
        this.history.meta.currentPage = 1
        this.load()
      },
    },
  },
}
</script>

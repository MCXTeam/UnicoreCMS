<template>
  <div class="px-4">
    <div class="row justify-content-between">
      <div class="col-12 col-xl-7">
        <h2 class="mt-0 mb-4">Транзакции и покупки</h2>
      </div>
      <div class="col input-fw">
        <vs-select class="mb-4" placeholder="Тип операции" v-model="history_type">
          <vs-option label="Пополнение баланса" value="payment">Пополнение баланса</vs-option>
          <vs-option label="Покупки в магазиине (товары)" value="product_purchase">Покупки в магазиине (товары)</vs-option>
          <vs-option label="Покупки в магазиине (киты)" value="kit_purchase">Покупки в магазиине (киты)</vs-option>
          <vs-option label="Покупки донат-групп" value="donate_group_purchase">Покупки донат-групп</vs-option>
          <vs-option label="Покупки донат-прав" value="donate_permission_purchase">Покупки донат-прав</vs-option>
          <vs-option label="Покупка монет" value="money_exchange">Покупка монет</vs-option>
          <vs-option label="Перевод монет" value="money_transfer">Перевод монет</vs-option>
          <vs-option label="Перевод реальной валюты" value="real_transfer">Перевод реальной валюты</vs-option>
        </vs-select>
      </div>
    </div>
    <div class="position-relative" ref="history">
      <vs-table class="no-overflow-table large-table" :key="history_type">
        <template #thead>
          <vs-tr>
            <vs-th style="max-width: 200px"> Дата </vs-th>

            <!-- Payments -->
            <vs-th v-if="history_type == 'payment'" style="max-width: 6rem"> ID платежа </vs-th>
            <vs-th v-if="history_type == 'payment'"> Платёжная система </vs-th>
            <vs-th v-if="history_type == 'payment'"> Сумма </vs-th>
            <vs-th v-if="history_type == 'payment'"> Статус </vs-th>

            <!-- Products -->
            <vs-th v-if="history_type == 'product_purchase'"> Товар </vs-th>
            <vs-th v-if="history_type == 'product_purchase'"> Сервер </vs-th>
            <vs-th v-if="history_type == 'product_purchase'" style="max-width: 6rem"> Количество </vs-th>

            <!-- Kits -->
            <vs-th v-if="history_type == 'kit_purchase'"> Кит </vs-th>
            <vs-th v-if="history_type == 'kit_purchase'"> Сервер </vs-th>

            <!-- DonateGroups -->
            <vs-th v-if="history_type == 'donate_group_purchase'"> Донат-группа </vs-th>
            <vs-th v-if="history_type == 'donate_group_purchase'"> Период </vs-th>
            <vs-th v-if="history_type == 'donate_group_purchase'"> Сервер </vs-th>

            <!-- DonateGroups -->
            <vs-th v-if="history_type == 'donate_permission_purchase'"> Донат-право </vs-th>
            <vs-th v-if="history_type == 'donate_permission_purchase'"> Период </vs-th>
            <vs-th v-if="history_type == 'donate_permission_purchase'"> Сервер </vs-th>

            <!-- MoneyExchange -->
            <vs-th v-if="history_type == 'money_exchange'"> Сервер </vs-th>
            <vs-th v-if="history_type == 'money_exchange'"> Количество </vs-th>

            <!-- MoneyTransfer -->
            <vs-th v-if="history_type == 'money_transfer'"> Игрок </vs-th>
            <vs-th v-if="history_type == 'money_transfer'"> Сервер </vs-th>
            <vs-th v-if="history_type == 'money_transfer'"> Количество </vs-th>

            <!-- RealTransfer -->
            <vs-th v-if="history_type == 'real_transfer'"> Игрок </vs-th>
            <vs-th v-if="history_type == 'real_transfer'"> Количество </vs-th>
          </vs-tr>
        </template>
        <template #tbody>
          <vs-tr :key="row.id" v-for="row in history.data" :data="row">
            <vs-td> {{ $moment(row.created).local().format('D MMMM YYYY, HH:mm:ss') }} </vs-td>

            <!-- Payments -->
            <vs-td v-if="history_type == 'payment' && row.payment" style="max-width: 6rem"> #{{ row.payment.id }} </vs-td>
            <vs-td v-if="history_type == 'payment' && row.payment"> {{ row.payment.method }} </vs-td>
            <vs-td v-if="history_type == 'payment' && row.payment"> {{ $utils.formatCurrency(row.payment.amount) }} </vs-td>
            <vs-td v-if="history_type == 'payment' && row.payment"> {{ row.payment.status }} </vs-td>

            <!-- Products -->
            <vs-td v-if="history_type == 'product_purchase' && row.product"> {{ row.product.name }} </vs-td>
            <vs-td v-if="history_type == 'product_purchase' && row.server">
              <nuxt-link :to="'/servers/' + row.server.id">{{ row.server.name }}</nuxt-link>
            </vs-td>
            <vs-td v-if="history_type == 'product_purchase' && row.amount"> {{ row.amount }} шт. </vs-td>

            <!-- Kits -->
            <vs-td v-if="history_type == 'kit_purchase' && row.kit"> {{ row.kit.name }} </vs-td>
            <vs-td v-if="history_type == 'kit_purchase' && row.server">
              <nuxt-link :to="'/servers/' + row.server.id">{{ row.server.name }}</nuxt-link>
            </vs-td>

            <!-- DonateGroups -->
            <vs-td v-if="history_type == 'donate_group_purchase' && row.donate_group"> {{ row.donate_group.name }} </vs-td>
            <vs-td v-if="history_type == 'donate_group_purchase' && row.period"> {{ row.period.name }} </vs-td>
            <vs-td v-if="history_type == 'donate_group_purchase' && row.server">
              <nuxt-link :to="'/servers/' + row.server.id">{{ row.server.name }}</nuxt-link>
            </vs-td>

            <!-- DonateGroups -->
            <vs-td v-if="history_type == 'donate_permission_purchase' && row.donate_permission"> {{ row.donate_permission.name }} </vs-td>
            <vs-td v-if="history_type == 'donate_permission_purchase' && row.period"> {{ row.period.name }} </vs-td>
            <vs-td v-if="history_type == 'donate_permission_purchase' && row.server">
              <nuxt-link :to="'/servers/' + row.server.id">{{ row.server.name }}</nuxt-link>
            </vs-td>

            <!-- MoneyExchange -->
            <vs-td v-if="history_type == 'money_exchange' && row.server">
              <nuxt-link :to="'/servers/' + row.server.id">{{ row.server.name }}</nuxt-link>
            </vs-td>
            <vs-td v-if="history_type == 'money_exchange' && row.amount"> {{ $utils.formatNumber(row.amount) }} </vs-td>

            <!-- MoneyTransfer -->
            <vs-td v-if="history_type == 'money_transfer' && row.target"> {{ row.target.username }} </vs-td>
            <vs-td v-if="history_type == 'money_transfer' && row.server">
              <nuxt-link :to="'/servers/' + row.server.id">{{ row.server.name }}</nuxt-link>
            </vs-td>
            <vs-td v-if="history_type == 'money_transfer' && row.amount"> {{ $utils.formatNumber(row.amount) }} </vs-td>

            <!-- RealTransfer -->
            <vs-td v-if="history_type == 'real_transfer' && row.target"> {{ row.target.username }} </vs-td>
            <vs-td v-if="history_type == 'real_transfer' && row.amount"> {{ $utils.formatCurrency(row.amount) }} </vs-td>
          </vs-tr>
        </template>
        <template #notFound>
          <span>История пуста...</span>
        </template>
      </vs-table>
      <vs-pagination v-if="history.data.length" class="mt-4" v-model="history.meta.currentPage" :length="history.meta.totalPages" />
    </div>
  </div>
</template>

<script>
export default {
  layout: 'cabinet',

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Личный кабинет')
  },

  data() {
    return {
      history_type: 'payment',
      history: {
        data: [],
        meta: {
          currentPage: 1,
          totalPages: 1,
        },
      },
    }
  },

  async fetch() {
    const loading = this.$vs.loading({ target: this.$refs.history })

    this.history = await this.$axios
      .get('/cabinet/history/me', {
        params: {
          page: this.history.meta.currentPage,
          'filter.type': '$eq:' + this.history_type,
        },
      })
      .then((res) => res.data)

    loading.close()
  },

  watch: {
    'history.meta.currentPage': {
      handler: function (newValue) {
        this.$fetch()
      },
    },
    history_type: {
      handler: function (newValue) {
        this.history.meta.currentPage = 1
        this.$fetch()
      },
    },
  },
}
</script>

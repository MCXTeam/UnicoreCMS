<template>
  <div>
    <section class="px-4 pb-4">
      <h2 class="mt-0 mb-3">Пополнение счёта</h2>
      <div v-if="bonuses" class="row">
        <div v-for="bonus in bonuses" :key="bonus.id" class="col-sm-6 col-md-4 col-xl-3 mb-3">
          <div
            class="mini-profile p-4 d-flex flex-column align-items-center justify-content-end h-100 bonus-block"
            :class="b_active && b_active.id == bonus.id && 'active'"
          >
            <img width="110px" v-if="bonus.icon" :src="`${$config.apiUrl}/${bonus.icon}`" />
            <div class="w-100 mt-3">
              <h2 class="m-0" v-text="$utils.formatCurrency(bonus.amount)" />
              <span>{{ bonus.bonus }}% в подарок</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="row">
        <div v-for="(n, index) in 4" :key="index" class="col-sm-6 col-md-4 col-xl-3 mb-3">
          <Skeleton width="100%" height="200px"></Skeleton>
        </div>
      </div>
      <ValidationObserver v-slot="{ invalid }">
        <div class="row mb-5 mt-4">
          <div class="col-xl-6 d-flex align-items-center mb-2">
            <p class="m-0">Или самостоятельно укажите нужную вам сумму монет в специальном поле справа</p>
          </div>
          <div class="col d-flex flex-column justify-content-center input-fw mb-2">
            <h4 class="mt-0 mb-1">Сумма</h4>
            <ValidationProvider v-slot="{ errors }" class="w-100" name="Сумма" rules="required|integer|min_value:1|max_value:15000">
              <vs-input v-model="payment.amount">
                <template #message-danger v-if="errors[0]">
                  {{ errors[0] }}
                </template>
              </vs-input>
            </ValidationProvider>
          </div>
          <div class="col-xl-6 d-flex align-items-center mb-2">
            <p class="m-0">
              После пополнения на Ваш счет будет зачислено:<br />
              <b v-if="b_active">Включая бонус размером {{ b_active.bonus }}%!</b>
            </p>
          </div>
          <div class="col d-flex align-items-center mb-2">
            <h2 v-if="b_active" class="m-0">
              {{ $utils.formatCurrency(Number(payment.amount) + (payment.amount / 100) * b_active.bonus) }}
            </h2>
            <h2 v-else class="m-0">{{ $utils.formatCurrency(Number(payment.amount)) }}</h2>
          </div>
        </div>
        <div v-for="method in payment_methods" :key="method" class="w-100 mini-profile p-2 my-2">
          <div class="d-flex align-items-center justify-content-between w-100">
            <div class="d-flex align-items-center">
              <vs-radio class="m-0" v-model="payment.method" :val="method" />
              <h4 class="m-0">Оплата через {{ payment_methods_map[method] }}</h4>
            </div>
            <vs-button
              @click="generateLink(method)"
              v-if="payment.method == method"
              :loading="loading_paylink"
              :disabled="invalid"
              size="large"
              >Пополнить баланс</vs-button
            >
          </div>
        </div>
      </ValidationObserver>
    </section>
    <hr />
    <section class="px-4">
      <div class="row">
        <div class="col-12 col-xl-6 input-fw">
          <h2 class="mt-4 mb-3">Перевод другому игроку</h2>
          <ValidationObserver v-slot="{ invalid }" @submit.prevent="setPassword">
            <h3 class="mb-1 mt-0">Сумма</h3>
            <ValidationProvider
              class="w-100"
              name="Сумма"
              :rules="`required|integer|min_value:1|max_value:${config.public_economy_rate * 1e4}`"
              v-slot="{ errors }"
            >
              <vs-input v-model="transfer_form.amount" placeholder="Введите сумму">
                <template #message-danger v-if="errors[0]">
                  {{ errors[0] }}
                </template>
              </vs-input>
            </ValidationProvider>
            <h3 class="mb-1 mt-3">Валюта</h3>
            <ValidationProvider class="w-100" name="Валюта" rules="required">
              <vs-select placeholder="Тип операции" v-model="transfer_form.type">
                <vs-option label="Реальная валюта" value="0">Реальная валюта ({{ $utils.formatCurrency($auth.user.real) }})</vs-option>
                <vs-option label="Монеты" value="1">Монеты</vs-option>
              </vs-select>
            </ValidationProvider>
            <h3 class="mb-1 mt-3">Ник игрока</h3>
            <ValidationProvider class="w-100" name="Ник игрока" rules="required" v-slot="{ errors }">
              <vs-input v-model="transfer_form.username" placeholder="Введите ник игрока">
                <template #message-danger v-if="errors[0]">
                  {{ errors[0] }}
                </template>
              </vs-input>
            </ValidationProvider>
            <ValidationProvider class="w-100" name="Сервер" rules="required" v-if="transfer_form.type == '1'">
              <h3 class="mb-1 mt-3">Сервер</h3>
              <vs-select :loading="loading" :key="servers.length" placeholder="Выберите сервер" v-model="transfer_form.server">
                <vs-option v-for="(server, index) in servers" :key="server.id" :label="server.name" :value="String(index)"
                  >{{ server.name }} ({{ $utils.formatNumber(money[index].money) }} монет)</vs-option
                >
              </vs-select>
            </ValidationProvider>
            <div class="d-flex mt-3">
              <vs-button @click="transfer()" :loading="loading" :disabled="invalid" size="large">Перевести</vs-button>
            </div>
          </ValidationObserver>
        </div>
        <div class="col-12 col-xl-6 input-fw">
          <h2 class="mt-4 mb-3">Обменник</h2>
          <ValidationObserver v-slot="{ invalid }" @submit.prevent="setPassword">
            <h3 class="mb-1 mt-0">Сумма</h3>
            <ValidationProvider
              class="w-100"
              name="Сумма"
              :rules="`required|integer|min_value:${config.public_economy_rate}|max_value:${config.public_economy_rate * 1e4}`"
              v-slot="{ errors }"
            >
              <vs-input v-model="exchange_form.amount" placeholder="Введите сумму">
                <template #message-danger v-if="errors[0]">
                  {{ errors[0] }}
                </template>
              </vs-input>
            </ValidationProvider>
            <h3 class="mb-1 mt-3">Тип операции</h3>
            <ValidationProvider class="w-100" name="Тип операции" rules="required">
              <vs-select placeholder="Тип операции" v-model="exchange_form.type">
                <vs-option label="Покупка монет" value="0">Покупка монет</vs-option>
                <vs-option label="Перевод между серверами" value="1">Перевод между серверами</vs-option>
              </vs-select>
            </ValidationProvider>
            <ValidationProvider v-if="exchange_form.type == '1'" class="w-100" name="Сервер" rules="required">
              <h3 class="mb-1 mt-3">С сервера</h3>
              <vs-select :loading="loading" :key="servers.length" placeholder="Выберите сервер" v-model="exchange_form.from_server">
                <vs-option v-for="(server, index) in servers" :key="server.id" :label="server.name" :value="String(index)"
                  >{{ server.name }} ({{ $utils.formatNumber(money[index].money) }} монет)</vs-option
                >
              </vs-select>
            </ValidationProvider>
            <ValidationProvider class="w-100" name="На сервер" rules="required">
              <h3 class="mb-1 mt-3">На сервер</h3>
              <vs-select :loading="loading" :key="servers.length" placeholder="Выберите сервер" v-model="exchange_form.server">
                <vs-option v-for="(server, index) in servers" :key="server.id" :label="server.name" :value="String(index)"
                  >{{ server.name }} ({{ $utils.formatNumber(money[index].money) }} монет)</vs-option
                >
              </vs-select>
            </ValidationProvider>
            <div class="d-flex mt-3">
              <vs-button
                @click="exchange()"
                :loading="loading"
                :disabled="invalid || (exchange_form.server == exchange_form.from_server && exchange_form.type == '1')"
                size="large"
                >{{ exchange_form.type == '1' ? 'Обменять' : 'Купить' }}</vs-button
              >
              <div v-if="!invalid">
                <div class="ms-2 calculate d-flex flex-column justify-content-center" v-if="exchange_form.type == '0'">
                  <h4 class="m-0">
                    {{ $utils.formatNumber(exchange_form.amount) }} монет за
                    {{ $utils.formatCurrency(exchange_form.amount / config.public_economy_rate) }}
                  </h4>
                  <small class="m-0">По курсу: {{ $utils.formatNumber(config.public_economy_rate) }}/{{ $utils.formatCurrency(1) }}</small>
                </div>
              </div>
            </div>
          </ValidationObserver>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  layout: 'cabinet',

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Личный кабинет')
  },

  computed: {
    ...mapGetters({
      config: 'unicore/config',
    }),
  },

  data() {
    return {
      bonuses: null,
      b_active: null,
      servers: [],
      money: [],
      loading: true,
      loading_paylink: false,
      transfer_form: {
        type: '',
        username: '',
        amount: '',
        server: '',
      },
      payment_methods: true,
      payment_methods_map: {
        anypay: 'AnyPay',
        centapp: 'CentApp',
        freekassa: 'FreeKassa',
        enotio: 'EnotIO',
        payok: 'PayOk',
        qiwi: 'Qiwi P2P',
        unitpay: 'UnitPay',
      },
      payment: {
        amount: 100,
        method: 100,
      },
      exchange_form: {
        type: '',
        amount: '',
        server: '',
        from_server: '',
      },
    }
  },

  async fetch() {
    this.loading = true

    this.payment_methods = await this.$axios.get('/payment/methods').then((res) => res.data)
    this.bonuses = await this.$axios.get('/payment/bonuses').then((res) => res.data)
    this.money = await this.$axios.get('/cabinet/money/me').then((res) => res.data)
    this.servers = await this.$axios.get('/servers').then((res) => res.data)

    if (this.payment_methods.length) this.payment.method = this.payment_methods[0]

    if (this.servers.length) {
      if (!this.transfer_form.server) this.transfer_form.server = String(0)
      if (!this.exchange_form.server) this.exchange_form.server = String(0)
      if (!this.exchange_form.from_server) this.exchange_form.from_server = String(0)
    }

    this.loading = false
  },

  methods: {
    async generateLink(method) {
      this.loading_paylink = true;
      try {
        const link = await this.$axios.post(`/payment/methods/${method}/link`, { amount: this.payment.amount }).then(res => res.data.link)
        window.location.href = link
      } catch {
        this.$unicore.errorNotification('При генерации платежа для данного метода оплаты произошла ошибка, попробуйте другой метод, либо свяжитесь с администрацией')
        this.loading_paylink = false;
      }
    },

    async transfer() {
      try {
        await this.$axios.post('cabinet/money/own/transfer', {
          ...this.transfer_form,
          amount: Number(this.transfer_form.amount),
          type: Number(this.transfer_form.type),
          server: this.servers[Number(this.transfer_form.server)].id,
        })
        await Promise.all([this.$auth.fetchUser(), this.$fetch()])
        this.$unicore.successNotification('Перевод успешно выполнен')
      } catch (e) {
        if (e.response?.status == 404) this.$unicore.errorNotification('Указанный вами игрок не найден')
        else this.$unicore.errorNotification('На балансе недостаточно денег, для совершения перевода')
      }
    },

    async exchange() {
      try {
        await this.$axios.post('cabinet/money/own/exchange', {
          amount: Number(this.exchange_form.amount),
          type: Number(this.exchange_form.type),
          server: this.servers[Number(this.exchange_form.server)].id,
          from_server: this.servers[Number(this.exchange_form.from_server)].id,
        })
        await Promise.all([this.$auth.fetchUser(), this.$fetch()])
        this.$unicore.successNotification('Обмен успешно выполнен')
      } catch {
        this.$unicore.errorNotification('На балансе недостаточно денег, для совершения обмена')
      }
    },
  },

  watch: {
    'payment.amount': {
      handler: function (newValue) {
        this.b_active = [...this.bonuses].reverse().find((b) => newValue >= b.amount)
      },
    },
  },
}
</script>

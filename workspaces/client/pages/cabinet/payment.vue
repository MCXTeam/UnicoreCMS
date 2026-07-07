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
            <img width="110px" v-if="bonus.icon" :src="`${$pub.apiBaseurl}/${bonus.icon}`" />
            <div class="w-100 mt-3">
              <h2 class="m-0" v-text="$utils.formatCurrency('real', bonus.amount)" />
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
      <VeeForm v-slot="{ meta }">
        <div class="row mb-5 mt-4">
          <div class="col-xl-6 d-flex align-items-center mb-2">
            <p class="m-0">Или самостоятельно укажите нужную вам сумму монет в специальном поле справа</p>
          </div>
          <div class="col d-flex flex-column justify-content-center input-fw mb-2">
            <h4 class="mt-0 mb-1">Сумма</h4>
            <VeeField
              v-model="payment.amount"
              name="Сумма"
              rules="required|integer|min_value:1|max_value:15000"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <InputText class="w-100" :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" />
              <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
            </VeeField>
          </div>
          <div class="col-xl-6 d-flex align-items-center mb-2">
            <p class="m-0">
              После пополнения на Ваш счет будет зачислено:<br />
              <b v-if="b_active">Включая бонус размером {{ b_active.bonus }}%!</b>
            </p>
          </div>
          <div class="col d-flex align-items-center mb-2">
            <h2 v-if="b_active" class="m-0">
              {{ $utils.formatCurrency('real', Number(payment.amount) + (payment.amount / 100) * b_active.bonus) }}
            </h2>
            <h2 v-else class="m-0">{{ $utils.formatCurrency('real', Number(payment.amount)) }}</h2>
          </div>
        </div>
        <div v-for="method in payment_methods" :key="method" class="w-100 mini-profile p-2 my-2">
          <div class="d-flex align-items-center justify-content-between w-100">
            <div class="d-flex align-items-center">
              <RadioButton class="m-0" v-model="payment.method" :value="method" />
              <h4 class="m-0 ms-2">Оплата через {{ payment_methods_map[method] }}</h4>
            </div>
            <Button
              @click="generateLink(method)"
              v-if="payment.method == method"
              :loading="loading_paylink"
              :disabled="!meta.valid"
              size="large"
              label="Пополнить баланс"
            />
          </div>
        </div>
      </VeeForm>
    </section>
    <hr />
    <section class="px-4">
      <div class="row">
        <div class="col-12 col-xl-6 input-fw">
          <h2 class="mt-4 mb-3">Перевод другому игроку</h2>
          <VeeForm v-slot="{ meta }">
            <h3 class="mb-1 mt-0">Сумма</h3>
            <VeeField
              name="Сумма"
              :rules="`required|integer|min_value:1|max_value:${config.public_economy_rate * 1e4}`"
              v-model="transfer_form.amount"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <InputText
                class="w-100"
                placeholder="Введите сумму"
                :modelValue="value"
                @update:modelValue="handleChange"
                @blur="handleBlur"
              />
              <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
            </VeeField>
            <h3 class="mb-1 mt-3">Валюта</h3>
            <VeeField name="Валюта" rules="required" v-model="transfer_form.type" v-slot="{ value, handleChange }">
              <Select
                class="w-100"
                placeholder="Тип валюты"
                :modelValue="value"
                @update:modelValue="handleChange"
                :options="transferTypeOptions"
                optionLabel="label"
                optionValue="value"
              >
                <template #option="{ option }">{{ option.display }}</template>
              </Select>
            </VeeField>
            <h3 class="mb-1 mt-3">Ник игрока</h3>
            <VeeField
              name="Ник игрока"
              rules="required"
              v-model="transfer_form.username"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <InputText
                class="w-100"
                placeholder="Введите ник игрока"
                :modelValue="value"
                @update:modelValue="handleChange"
                @blur="handleBlur"
              />
              <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
            </VeeField>
            <VeeField
              v-if="transfer_form.type == '1'"
              name="Сервер"
              rules="required"
              v-model="transfer_form.server"
              v-slot="{ value, handleChange }"
            >
              <h3 class="mb-1 mt-3">Сервер</h3>
              <Select
                class="w-100"
                :loading="loading"
                :key="servers.length"
                placeholder="Выберите сервер"
                :modelValue="value"
                @update:modelValue="handleChange"
                :options="serverOptions"
                optionLabel="label"
                optionValue="value"
              >
                <template #option="{ option }">{{ option.display }}</template>
              </Select>
            </VeeField>
            <div class="d-flex mt-3">
              <Button @click="transfer()" :loading="loading" :disabled="!meta.valid" size="large" label="Перевести" />
            </div>
          </VeeForm>
        </div>
        <div class="col-12 col-xl-6 input-fw">
          <h2 class="mt-4 mb-3">Обменник</h2>
          <VeeForm v-slot="{ meta }">
            <h3 class="mb-1 mt-0">Сумма</h3>
            <VeeField
              name="Сумма"
              :rules="`required|integer|min_value:${config.public_economy_rate}|max_value:${config.public_economy_rate * 1e4}`"
              v-model="exchange_form.amount"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <InputText
                class="w-100"
                placeholder="Введите сумму"
                :modelValue="value"
                @update:modelValue="handleChange"
                @blur="handleBlur"
              />
              <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
            </VeeField>
            <h3 class="mb-1 mt-3">Тип операции</h3>
            <VeeField name="Тип операции" rules="required" v-model="exchange_form.type" v-slot="{ value, handleChange }">
              <Select
                class="w-100"
                placeholder="Тип операции"
                :modelValue="value"
                @update:modelValue="handleChange"
                :options="exchangeTypeOptions"
                optionLabel="label"
                optionValue="value"
              />
            </VeeField>
            <VeeField
              v-if="exchange_form.type == '1'"
              name="Сервер"
              rules="required"
              v-model="exchange_form.from_server"
              v-slot="{ value, handleChange }"
            >
              <h3 class="mb-1 mt-3">С сервера</h3>
              <Select
                class="w-100"
                :loading="loading"
                :key="servers.length"
                placeholder="Выберите сервер"
                :modelValue="value"
                @update:modelValue="handleChange"
                :options="serverOptions"
                optionLabel="label"
                optionValue="value"
              >
                <template #option="{ option }">{{ option.display }}</template>
              </Select>
            </VeeField>
            <VeeField name="На сервер" rules="required" v-model="exchange_form.server" v-slot="{ value, handleChange }">
              <h3 class="mb-1 mt-3">На сервер</h3>
              <Select
                class="w-100"
                :loading="loading"
                :key="servers.length"
                placeholder="Выберите сервер"
                :modelValue="value"
                @update:modelValue="handleChange"
                :options="serverOptions"
                optionLabel="label"
                optionValue="value"
              >
                <template #option="{ option }">{{ option.display }}</template>
              </Select>
            </VeeField>
            <div class="d-flex mt-3">
              <Button
                @click="exchange()"
                :loading="loading"
                :disabled="!meta.valid || (exchange_form.server == exchange_form.from_server && exchange_form.type == '1')"
                size="large"
                :label="exchange_form.type == '1' ? 'Обменять' : 'Купить'"
              />
              <div v-if="meta.valid">
                <div class="ms-2 calculate d-flex flex-column justify-content-center" v-if="exchange_form.type == '0'">
                  <h4 class="m-0">
                    {{ $utils.formatCurrency('ingame', exchange_form.amount) }} монет за
                    {{ $utils.formatCurrency('real', exchange_form.amount / config.public_economy_rate) }}
                  </h4>
                  <small class="m-0"
                    >По курсу: {{ $utils.formatCurrency('ingame', config.public_economy_rate) }}/{{
                      $utils.formatCurrency('real', 1)
                    }}</small
                  >
                </div>
              </div>
            </div>
          </VeeForm>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { Form, Field } from 'vee-validate'
import { useConfigStore } from '~/stores/config'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'verify'],
  title: 'Личный кабинет',
})

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },

  setup() {
    const configStore = useConfigStore()
    return { config: computed(() => configStore.config) }
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

  computed: {
    transferTypeOptions() {
      return [
        { label: 'Реальная валюта', value: '0', display: `Реальная валюта (${this.$utils.formatCurrency('real', this.$auth.user.real)})` },
        { label: 'Монеты', value: '1', display: 'Монеты' },
      ]
    },
    exchangeTypeOptions() {
      return [
        { label: 'Покупка монет', value: '0' },
        { label: 'Перевод между серверами', value: '1' },
      ]
    },
    serverOptions() {
      return this.servers.map((server, index) => ({
        label: server.name,
        value: String(index),
        display: `${server.name} (${this.$utils.formatCurrency('ingame', this.money[index] ? this.money[index].money : 0)} монет)`,
      }))
    },
  },

  mounted() {
    this.load()
  },

  methods: {
    async load() {
      this.loading = true

      this.payment_methods = await this.$api.get('/payment/methods').then((res) => res.data)
      this.bonuses = await this.$api.get('/payment/bonuses').then((res) => res.data)
      this.money = await this.$api.get('/cabinet/money/me').then((res) => res.data)
      this.servers = await this.$api.get('/servers').then((res) => res.data)

      if (this.payment_methods.length) this.payment.method = this.payment_methods[0]

      if (this.servers.length) {
        if (!this.transfer_form.server) this.transfer_form.server = String(0)
        if (!this.exchange_form.server) this.exchange_form.server = String(0)
        if (!this.exchange_form.from_server) this.exchange_form.from_server = String(0)
      }

      this.loading = false
    },

    async generateLink(method) {
      this.loading_paylink = true
      try {
        const link = await this.$api
          .post(`/payment/methods/${method}/link`, { amount: Number(this.payment.amount) })
          .then((res) => res.data.link)
        window.location.href = link
      } catch {
        this.$unicore.errorNotification(
          'При генерации платежа для данного метода оплаты произошла ошибка, попробуйте другой метод, либо свяжитесь с администрацией',
        )
        this.loading_paylink = false
      }
    },

    async transfer() {
      try {
        await this.$api.post('cabinet/money/own/transfer', {
          ...this.transfer_form,
          amount: Number(this.transfer_form.amount),
          type: Number(this.transfer_form.type),
          server: this.servers[Number(this.transfer_form.server)].id,
        })
        await Promise.all([this.$auth.fetchUser(), this.load()])
        this.$unicore.successNotification('Перевод успешно выполнен')
      } catch (e) {
        if (e.response?.status == 404) this.$unicore.errorNotification('Указанный вами игрок не найден')
        else this.$unicore.errorNotification('На балансе недостаточно денег, для совершения перевода')
      }
    },

    async exchange() {
      try {
        await this.$api.post('cabinet/money/own/exchange', {
          amount: Number(this.exchange_form.amount),
          type: Number(this.exchange_form.type),
          server: this.servers[Number(this.exchange_form.server)].id,
          from_server: this.servers[Number(this.exchange_form.from_server)].id,
        })
        await Promise.all([this.$auth.fetchUser(), this.load()])
        this.$unicore.successNotification('Обмен успешно выполнен')
      } catch {
        this.$unicore.errorNotification('На балансе недостаточно денег, для совершения обмена')
      }
    },
  },

  watch: {
    'payment.amount': {
      handler: function (newValue) {
        this.b_active = [...this.bonuses].reverse().find((b) => Number(newValue) >= b.amount)
      },
    },
  },
}
</script>

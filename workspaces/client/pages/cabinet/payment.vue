<template>
  <div>
    <section class="px-4 pb-4">
      <h2 class="mt-0 mb-3">{{ $t('cabinet.topup_title') }}</h2>
      <div v-if="bonuses" class="row">
        <div v-for="bonus in bonuses" :key="bonus.id" class="col-sm-6 col-md-4 col-xl-3 mb-3">
          <div
            class="mini-profile p-4 d-flex flex-column align-items-center justify-content-end h-100 bonus-block"
            :class="b_active && b_active.id == bonus.id && 'active'"
          >
            <img width="110px" v-if="bonus.icon" :src="`${$pub.apiBaseurl}/${bonus.icon}`" />
            <div class="w-100 mt-3">
              <h2 class="m-0" v-text="$utils.formatCurrency('real', bonus.amount)" />
              <span>{{ $t('cabinet.bonus_gift', { percent: bonus.bonus }) }}</span>
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
            <p class="m-0">{{ $t('cabinet.topup_custom') }}</p>
          </div>
          <div class="col d-flex flex-column justify-content-center input-fw mb-2">
            <h4 class="mt-0 mb-1">{{ $t('cabinet.sum') }}</h4>
            <VeeField
              v-model="payment.amount"
              :name="$t('cabinet.sum')"
              rules="required|integer|min_value:1|max_value:15000"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <InputText class="w-100" :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" />
              <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
            </VeeField>
          </div>
          <div class="col-xl-6 d-flex align-items-center mb-2">
            <p class="m-0">
              {{ $t('cabinet.topup_result') }}<br />
              <b v-if="b_active">{{ $t('cabinet.topup_with_bonus', { percent: b_active.bonus }) }}</b>
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
              <h4 class="m-0 ms-2">{{ $t('cabinet.pay_via', { method: payment_methods_map[method] }) }}</h4>
            </div>
            <Button
              @click="generateLink(method)"
              v-if="payment.method == method"
              :loading="loading_paylink"
              :disabled="!meta.valid"
              size="large"
              :label="$t('cabinet.topup_button')"
            />
          </div>
        </div>
      </VeeForm>
    </section>
    <hr />
    <section class="px-4">
      <div class="row">
        <div class="col-12 col-xl-6 input-fw">
          <h2 class="mt-4 mb-3">{{ $t('cabinet.transfer_title') }}</h2>
          <VeeForm v-slot="{ meta }">
            <h3 class="mb-1 mt-0">{{ $t('cabinet.sum') }}</h3>
            <VeeField
              :name="$t('cabinet.sum')"
              :rules="`required|integer|min_value:1|max_value:${config.public_economy_rate * 1e4}`"
              v-model="transfer_form.amount"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <InputText
                class="w-100"
                :placeholder="$t('cabinet.sum_placeholder')"
                :modelValue="value"
                @update:modelValue="handleChange"
                @blur="handleBlur"
              />
              <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
            </VeeField>
            <h3 class="mb-1 mt-3">{{ $t('cabinet.currency') }}</h3>
            <VeeField :name="$t('cabinet.currency')" rules="required" v-model="transfer_form.type" v-slot="{ value, handleChange }">
              <Select
                class="w-100"
                :placeholder="$t('cabinet.currency_type')"
                :modelValue="value"
                @update:modelValue="handleChange"
                :options="transferTypeOptions"
                optionLabel="label"
                optionValue="value"
              >
                <template #option="{ option }">{{ option.display }}</template>
              </Select>
            </VeeField>
            <h3 class="mb-1 mt-3">{{ $t('cabinet.player_nick') }}</h3>
            <VeeField
              :name="$t('cabinet.player_nick')"
              rules="required"
              v-model="transfer_form.username"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <InputText
                class="w-100"
                :placeholder="$t('cabinet.player_nick_placeholder')"
                :modelValue="value"
                @update:modelValue="handleChange"
                @blur="handleBlur"
              />
              <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
            </VeeField>
            <VeeField
              v-if="transfer_form.type == '1'"
              :name="$t('cabinet.server')"
              rules="required"
              v-model="transfer_form.server"
              v-slot="{ value, handleChange }"
            >
              <h3 class="mb-1 mt-3">{{ $t('cabinet.server') }}</h3>
              <Select
                class="w-100"
                :loading="loading"
                :key="servers.length"
                :placeholder="$t('store.choose_server')"
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
              <Button @click="transfer()" :loading="loading" :disabled="!meta.valid" size="large" :label="$t('cabinet.transfer')" />
            </div>
          </VeeForm>
        </div>
        <div class="col-12 col-xl-6 input-fw">
          <h2 class="mt-4 mb-3">{{ $t('cabinet.exchange_title') }}</h2>
          <VeeForm v-slot="{ meta }">
            <h3 class="mb-1 mt-0">{{ $t('cabinet.sum') }}</h3>
            <VeeField
              :name="$t('cabinet.sum')"
              :rules="`required|integer|min_value:${config.public_economy_rate}|max_value:${config.public_economy_rate * 1e4}`"
              v-model="exchange_form.amount"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <InputText
                class="w-100"
                :placeholder="$t('cabinet.sum_placeholder')"
                :modelValue="value"
                @update:modelValue="handleChange"
                @blur="handleBlur"
              />
              <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
            </VeeField>
            <h3 class="mb-1 mt-3">{{ $t('cabinet.operation_type') }}</h3>
            <VeeField :name="$t('cabinet.operation_type')" rules="required" v-model="exchange_form.type" v-slot="{ value, handleChange }">
              <Select
                class="w-100"
                :placeholder="$t('cabinet.operation_type')"
                :modelValue="value"
                @update:modelValue="handleChange"
                :options="exchangeTypeOptions"
                optionLabel="label"
                optionValue="value"
              />
            </VeeField>
            <VeeField
              v-if="exchange_form.type == '1'"
              :name="$t('cabinet.server')"
              rules="required"
              v-model="exchange_form.from_server"
              v-slot="{ value, handleChange }"
            >
              <h3 class="mb-1 mt-3">{{ $t('cabinet.from_server') }}</h3>
              <Select
                class="w-100"
                :loading="loading"
                :key="servers.length"
                :placeholder="$t('store.choose_server')"
                :modelValue="value"
                @update:modelValue="handleChange"
                :options="serverOptions"
                optionLabel="label"
                optionValue="value"
              >
                <template #option="{ option }">{{ option.display }}</template>
              </Select>
            </VeeField>
            <VeeField :name="$t('cabinet.to_server')" rules="required" v-model="exchange_form.server" v-slot="{ value, handleChange }">
              <h3 class="mb-1 mt-3">{{ $t('cabinet.to_server') }}</h3>
              <Select
                class="w-100"
                :loading="loading"
                :key="servers.length"
                :placeholder="$t('store.choose_server')"
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
                :label="exchange_form.type == '1' ? $t('cabinet.exchange') : $t('cabinet.buy')"
              />
              <div v-if="meta.valid">
                <div class="ms-2 calculate d-flex flex-column justify-content-center" v-if="exchange_form.type == '0'">
                  <h4 class="m-0">
                    {{
                      $t('cabinet.exchange_calc', {
                        coins: $utils.formatCurrency('ingame', exchange_form.amount),
                        price: $utils.formatCurrency('real', exchange_form.amount / config.public_economy_rate),
                      })
                    }}
                  </h4>
                  <small class="m-0">
                    {{
                      $t('cabinet.exchange_rate', {
                        coins: $utils.formatCurrency('ingame', config.public_economy_rate),
                        price: $utils.formatCurrency('real', 1),
                      })
                    }}
                  </small>
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

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'verify'],
  title: 'cabinet.tab_payment',
})

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },

  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('header.cabinet')) })

    return { config: usePublicConfig().config, moneyApi: useMoney(), serversApi: useServers() }
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
        {
          label: this.$t('cabinet.real_currency'),
          value: '0',
          display: `${this.$t('cabinet.real_currency')} (${this.$utils.formatCurrency('real', this.$auth.user.real)})`,
        },
        { label: this.$t('cabinet.coins_currency'), value: '1', display: this.$t('cabinet.coins_currency') },
      ]
    },
    exchangeTypeOptions() {
      return [
        { label: this.$t('cabinet.type_money_exchange'), value: '0' },
        { label: this.$t('cabinet.between_servers'), value: '1' },
      ]
    },
    serverOptions() {
      return this.servers.map((server, index) => ({
        label: server.name,
        value: String(index),
        display: `${server.name} (${this.$t('cabinet.coins', {
          amount: this.$utils.formatCurrency('ingame', this.money[index] ? this.money[index].money : 0),
        })})`,
      }))
    },
  },

  mounted() {
    this.load()
  },

  methods: {
    async load() {
      this.loading = true

      this.payment_methods = await this.moneyApi.paymentMethods()
      this.bonuses = await this.moneyApi.bonuses()
      this.money = await this.moneyApi.balance()
      this.servers = await this.serversApi.fetchList()

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
        window.location.href = await this.moneyApi.paymentLink(method, Number(this.payment.amount))
      } catch {
        this.$unicore.errorNotification(this.$t('cabinet.payment_link_error'))
        this.loading_paylink = false
      }
    },

    async transfer() {
      try {
        await this.moneyApi.transfer({
          ...this.transfer_form,
          amount: Number(this.transfer_form.amount),
          type: Number(this.transfer_form.type),
          server: this.servers[Number(this.transfer_form.server)].id,
        })
        await Promise.all([this.$auth.fetchUser(), this.load()])
        this.$unicore.successNotification(this.$t('cabinet.transfer_done'))
      } catch (e) {
        if (e.response?.status == 404) this.$unicore.errorNotification(this.$t('cabinet.player_not_found'))
        else this.$unicore.errorNotification(this.$t('cabinet.transfer_not_enough'))
      }
    },

    async exchange() {
      try {
        await this.moneyApi.exchange({
          amount: Number(this.exchange_form.amount),
          type: Number(this.exchange_form.type),
          server: this.servers[Number(this.exchange_form.server)].id,
          from_server: this.servers[Number(this.exchange_form.from_server)].id,
        })
        await Promise.all([this.$auth.fetchUser(), this.load()])
        this.$unicore.successNotification(this.$t('cabinet.exchange_done'))
      } catch {
        this.$unicore.errorNotification(this.$t('cabinet.exchange_not_enough'))
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

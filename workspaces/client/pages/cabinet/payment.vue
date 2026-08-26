<template>
  <div class="cab-grid">
    <CabTile v-if="canPayment" :title="$t('cabinet.topup_title')" icon="bx bx-wallet-alt" :span="12">
      <div v-if="bonuses" class="cab-packs">
        <button
          v-for="bonus in bonuses"
          :key="bonus.id"
          type="button"
          :class="['cab-pack', { 'cab-pack--active': b_active && b_active.id == bonus.id }]"
          @click="payment.amount = String(bonus.amount)"
        >
          <img v-if="bonus.icon" :src="`${$pub.apiBaseurl}/${bonus.icon}`" />
          <h3 class="m-0" v-text="$utils.formatCurrency('real', bonus.amount)" />
          <span>{{ $t('cabinet.bonus_gift', { percent: bonus.bonus }) }}</span>
        </button>
      </div>
      <div v-else class="cab-packs">
        <Skeleton v-for="n in 4" :key="n" height="170px" borderRadius="14px" />
      </div>

      <VeeForm v-slot="{ meta }">
        <div class="cab-pay">
          <div class="cab-pay__amount">
            <label class="cab-label">{{ $t('cabinet.sum') }}</label>
            <VeeField
              v-model="payment.amount"
              :name="$t('cabinet.sum')"
              rules="required|integer|min_value:1|max_value:15000"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <InputText class="w-100" :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" />
              <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
            </VeeField>
            <p class="cab-sub m-0 mt-2">{{ $t('cabinet.topup_custom') }}</p>
          </div>
          <div class="cab-pay__result">
            <span class="cab-metrics__label">{{ $t('cabinet.topup_result') }}</span>
            <span class="cab-metrics__value" v-if="b_active">
              {{ $utils.formatCurrency('real', Number(payment.amount) + (payment.amount / 100) * b_active.bonus) }}
            </span>
            <span class="cab-metrics__value" v-else>{{ $utils.formatCurrency('real', Number(payment.amount)) }}</span>
            <span v-if="b_active" class="cab-sub">{{ $t('cabinet.topup_with_bonus', { percent: b_active.bonus }) }}</span>
          </div>
        </div>

        <h5 class="cab-section mt-4">{{ $t('cabinet.pay_method') }}</h5>
        <div v-if="!payment_methods.length" class="cab-empty">
          <i class="bx bx-credit-card"></i>
          <span>{{ $t('cabinet.pay_methods_empty') }}</span>
        </div>
        <div v-else class="cab-methods">
          <label v-for="method in payment_methods" :key="method" class="cab-method">
            <RadioButton v-model="payment.method" :value="method" />
            <span class="cab-method__name">{{ $t('cabinet.pay_via', { method: payment_methods_map[method] }) }}</span>
            <Button
              v-if="payment.method == method"
              class="ms-auto"
              :loading="loading_paylink"
              :disabled="!meta.valid"
              :label="$t('cabinet.topup_button')"
              @click="generateLink(method)"
            />
          </label>
        </div>
      </VeeForm>
    </CabTile>

    <CabTile v-if="canTransfer" :title="$t('cabinet.transfer_title')" icon="bx bx-transfer" :span="6">
      <VeeForm v-slot="{ meta }" class="cab-form">
        <div class="cab-field">
          <label class="cab-label">{{ $t('cabinet.sum') }}</label>
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
        </div>

        <div class="cab-field">
          <label class="cab-label">{{ $t('cabinet.currency') }}</label>
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
        </div>

        <div class="cab-field">
          <label class="cab-label">{{ $t('cabinet.player_nick') }}</label>
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
        </div>

        <VeeField
          v-if="transfer_form.type == '1'"
          :name="$t('cabinet.server')"
          rules="required"
          v-model="transfer_form.server"
          v-slot="{ value, handleChange }"
        >
          <div class="cab-field">
            <label class="cab-label">{{ $t('cabinet.server') }}</label>
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
          </div>
        </VeeField>

        <Button class="w-100 mt-2" :loading="loading" :disabled="!meta.valid" :label="$t('cabinet.transfer')" @click="transfer()" />
      </VeeForm>
    </CabTile>

    <CabTile v-if="canExchange" :title="$t('cabinet.exchange_title')" icon="bx bx-coin-stack" :span="6">
      <VeeForm v-slot="{ meta }" class="cab-form">
        <div class="cab-field">
          <label class="cab-label">{{ $t('cabinet.sum') }}</label>
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
        </div>

        <div class="cab-field">
          <label class="cab-label">{{ $t('cabinet.operation_type') }}</label>
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
        </div>

        <VeeField
          v-if="exchange_form.type == '1'"
          :name="$t('cabinet.server')"
          rules="required"
          v-model="exchange_form.from_server"
          v-slot="{ value, handleChange }"
        >
          <div class="cab-field">
            <label class="cab-label">{{ $t('cabinet.from_server') }}</label>
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
          </div>
        </VeeField>

        <VeeField :name="$t('cabinet.to_server')" rules="required" v-model="exchange_form.server" v-slot="{ value, handleChange }">
          <div class="cab-field">
            <label class="cab-label">{{ $t('cabinet.to_server') }}</label>
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
          </div>
        </VeeField>

        <div v-if="meta.valid && exchange_form.type == '0'" class="cab-note">
          <h4 class="m-0">
            {{
              $t('cabinet.exchange_calc', {
                coins: $utils.formatCurrency('ingame', exchange_form.amount),
                price: $utils.formatCurrency('real', exchange_form.amount / config.public_economy_rate),
              })
            }}
          </h4>
          <small>
            {{
              $t('cabinet.exchange_rate', {
                coins: $utils.formatCurrency('ingame', config.public_economy_rate),
                price: $utils.formatCurrency('real', 1),
              })
            }}
          </small>
        </div>

        <Button
          class="w-100 mt-2"
          :loading="loading"
          :disabled="!meta.valid || (exchange_form.server == exchange_form.from_server && exchange_form.type == '1')"
          :label="exchange_form.type == '1' ? $t('cabinet.exchange') : $t('cabinet.buy')"
          @click="exchange()"
        />
      </VeeForm>
    </CabTile>
  </div>
</template>

<script>
import { Form, Field } from 'vee-validate'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'verify'],
  title: 'cabinet.tab_payment',
  hint: 'cabinet.payment_hint',
})

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },

  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('header.cabinet')) })

    const access = useAccess({
      canPayment: 'player.payment',
      canTransfer: 'player.transfer',
      canExchange: 'player.exchange',
    })

    return { config: usePublicConfig().config, moneyApi: useMoney(), serversApi: useServers(), ...access }
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

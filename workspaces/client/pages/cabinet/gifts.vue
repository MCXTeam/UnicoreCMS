<template>
  <div>
    <vs-dialog class="buy-dialog" v-model="giftDialog" v-if="gift">
      <template #header>
        <div class="d-flex flex-column align-items-center">
          <h4 class="mt-2 mb-0">Гифт-код активирован!</h4>
          <h3 class="mt-2 mb-0">Вы получили:</h3>
        </div>
      </template>
      <div class="text-center">
        <img height="100px" src="/images/chest-minecraft.gif" />
        <h4 v-if="gift.type == 'real'" class="m-0">{{ $utils.formatCurrency('real', gift.amount) }} на баланс</h4>
        <h4 v-if="gift.type == 'money'" class="m-0">{{ $utils.formatCurrency('ingame', gift.amount) }} монет на сервере {{ gift.server.name }}</h4>
        <h4 v-if="gift.type == 'donate'" class="m-0">
          Донат-группу "{{ gift.donate_group.name }}" ({{ gift.period.name }}) на сервере {{ gift.server.name }}
        </h4>
        <h4 v-if="gift.type == 'permission' && gift.donate_permission.type == 'web'" class="m-0">
          Донат-право "{{ gift.donate_permission.name }}" ({{ gift.period.name }})
        </h4>
        <h4 v-if="gift.type == 'permission' && gift.donate_permission.type != 'web'" class="m-0">
          Донат-право "{{ gift.donate_permission.name }}" ({{ gift.period.name }}) на сервере {{ gift.server.name }}
        </h4>
        <h4 v-if="gift.type == 'product' && gift.donate_permission != 'web'" class="m-0">
          Товар из магазина "{{ gift.product.name }}" ({{ gift.amount }} шт.) на сервере {{ gift.server.name }}
        </h4>
        <h4 v-if="gift.type == 'kit' && gift.donate_permission != 'web'" class="m-0">
          Кит из магазина "{{ gift.kit.name }}" на сервере {{ gift.server.name }}
        </h4>
      </div>
    </vs-dialog>
    <section class="px-4 pb-3">
      <h2 class="mt-0 mb-3">Гифт-коды</h2>
      <div class="row settings-split">
        <div class="col-xl-6 input-fw pe-xl-4 mb-4">
          <ValidationObserver v-slot="{ invalid }">
            <ValidationProvider class="w-100" name="гифт-код" rules="required">
              <vs-input v-model="gift_code" placeholder="Введите гифт-код" />
            </ValidationProvider>
            <vs-button :loadong="loading" @click="activateGift()" :disabled="invalid" class="mt-3" size="large" block
              >Активировать</vs-button
            >
          </ValidationObserver>
        </div>
        <div class="col ps-xl-5">
          <h3 class="m-0">Где найти код?</h3>
          <p class="mt-1">Переодически мы публикуем коды в наших социальных сетях, чтобы не пропускать их, советуем подписаться.</p>
          <h3 class="m-0">Что содержат гифт-коды?</h3>
          <p class="mt-1">
            Активировав гифт-код вы можете получить деньги на баланс, монеты, игровые предметы или киты, а также донат-группы или
            донат-права
          </p>
        </div>
      </div>
    </section>
    <hr />
    <section class="px-4 mt-5">
      <h2 class="mt-0 mb-3">Голосование</h2>
      <div class="row settings-split">
        <div class="col-xl-6 input-fw pe-xl-4 mb-4">
          <table class="player-info-table w-100">
            <tr v-for="mon in monitorings" :key="mon">
              <td class="d-flex align-items-center py-2">
                <img width="30px" :src="monitorings_map[mon].icon" />
                <h4 class="m-0 ms-3" v-text="monitorings_map[mon].name" />
              </td>
              <td>
                <vs-button block :href="config['public_link_' + mon]">Голосовать на {{ monitorings_map[mon].name }}</vs-button>
              </td>
            </tr>
          </table>
        </div>
        <div class="col ps-xl-5">
          <h3 class="mt-0 mb-3">Что вы получите, проголосовав в {{ monitorings.length }} рейтингах?</h3>
          <p class="mt-1">
            <b>Бонусы</b> - валюта за которую вы можете частично или полностью оплачивать товары из магазина, наборы ресурсов, донат-группы и донат-киты.
          </p>
          <div class="row">
            <div class="col-xl-6">
              <div class="mini-profile p-4 my-3 h-75">
                <h2 class="mt-0 mb-2">{{ $utils.formatCurrency('virtual', config.public_monitoring_reward * monitorings.length) }}</h2>
                <span>Бонусов</span>
              </div>
            </div>
            <div class="col-xl-6">
              <div class="mini-profile p-4 my-3 h-75">
                <h2 class="mt-0 mb-2">{{ monitorings.length }}</h2>
                <span>Очка в топе</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import monitorings from "~/json/monitorings.json"

export default {
  layout: 'cabinet',

  data() {
    return {
      monitorings: [],
      giftDialog: false,
      gift: null,
      loading: false,
      monitorings_map: monitorings,
      gift_code: '',
    }
  },

  async mounted() {
    try {
      await this.$recaptcha.init()
    } catch (e) {
      console.error(e)
    }
  },

  beforeDestroy() {
    this.$recaptcha.destroy()
  },

  computed: {
    ...mapGetters({
      config: 'config',
    }),
  },

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Личный кабинет')
  },

  async fetch() {
    this.monitorings = await this.$axios.get('cabinet/votes/monitorings').then((res) => res.data)
  },

  methods: {
    async activateGift() {
      this.loading = true
      try {
        const recaptcha = await this.$recaptcha.execute('gift')
        this.gift = await this.$axios
          .post(
            '/cabinet/gifts/activate',
            {
              gift_code: this.gift_code,
            },
            { headers: { recaptcha } }
          )
          .then((res) => res.data)

        if (this.gift.type == 'real')
          this.$auth.fetchUser()

        this.giftDialog = true
      } catch {
        this.$unicore.errorNotification('Указанный вами промокод не найден, либо вы уже активировали его')
      }
      this.loading = false
    },
  },
}
</script>

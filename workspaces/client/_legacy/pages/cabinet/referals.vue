<template>
  <div>
    <section class="px-4 pb-4">
      <h2 class="mt-0 mb-3">Реферальная система</h2>
      <p><b>Реферальная система</b> – это форма сотрудничества, основанная на награждении рефереров за привлечение новых игроков.</p>
      <div class="row">
        <div class="col-xl-6">
          <h4 class="m-0">Что получаете вы?</h4>
          <div class="mini-profile p-4 my-3 h-75">
            <h2 class="mt-0 mb-2">{{ $utils.formatCurrency('real', config.public_referal_reward) }} на баланс</h2>
            <span
              >Если приглашённый вами игрок отыграет на проекте не менее
              {{
                $moment.duration(config.public_referal_trigger, 'minutes').format('y [years], w [weeks], d [days], h [hours], m [minutes]')
              }}.</span
            >
          </div>
        </div>
        <div class="col-xl-6">
          <h4 class="m-0">Что получает игрок?</h4>
          <div class="mini-profile p-4 my-3 h-75">
            <h2 class="mt-0 mb-2">{{ $utils.formatCurrency('real', config.public_referal_reward_player) }} на баланс</h2>
            <span
              >Если он отыграет на проекте не менее
              {{
                $moment.duration(config.public_referal_trigger, 'minutes').format('y [years], w [weeks], d [days], h [hours], m [minutes]')
              }}.</span
            >
          </div>
        </div>
      </div>
    </section>
    <hr />
    <section class="px-4 pb-4">
      <h2 class="mt-4 mb-3">Ваша реферальная ссылка</h2>
      <div class="row">
        <div class="col-xl-9 input-fw d-flex align-items-center">
          <vs-input v-model="link" readonly></vs-input>
        </div>
        <div class="col d-flex align-items-center">
          <vs-button @click="copyLink()" block size="large">Копировать</vs-button>
        </div>
      </div>
      <h3 class="mb-3 mt-4">Приглашённые вами игроки</h3>
      <vs-table class="no-overflow-table large-table">
        <template #thead>
          <vs-tr>
            <vs-th>Дата </vs-th>
            <vs-th style="width: 35%">Логин </vs-th>
            <vs-th style="width: 35%">Время в игре </vs-th>
          </vs-tr>
        </template>
        <template #tbody>
          <vs-tr :key="referal.uuid" v-for="referal in referals" :data="referal">
            <vs-td> {{ $moment(referal.user.created).local().format('DD.MM.YYYY, HH:mm:ss') }} </vs-td>
            <vs-td>
              <div class="d-flex align-items-center">
                <Avatar class="rounded shadow me-3">
                  <SkinView2D class="rounded" :width="32" :height="32" :skin="referal.user.skin" />
                </Avatar>
                <nuxt-link :to="`/user/` + referal.user.username">{{ referal.user.username }}</nuxt-link>
              </div>
            </vs-td>
            <vs-td>{{ $moment.duration(referal.playtime, 'minutes').format('y [years], w [weeks], d [days], h [hours], m [minutes]') }}</vs-td>
          </vs-tr>
        </template>
        <template #notFound>
          <span>Похоже, что вы ещё никого не пригласили...</span>
        </template>
      </vs-table>
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
      config: 'config',
    }),
  },

  data() {
    return {
      link: '',
      referals: [],
    }
  },

  mounted() {
    this.link = `${this.$config.url}/start?ref=${this.$auth.user.username}`
  },

  async fetch() {
    this.referals = await this.$axios.get('/cabinet/referals/me').then((res) => res.data)
  },

  methods: {
    async copyLink() {
      await navigator.clipboard.writeText(this.link)
      this.$unicore.successNotification('Ссылка скопирована в буфер обмена')
    },
  },
}
</script>

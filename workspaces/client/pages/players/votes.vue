<template>
  <div class="px-4">
    <div class="d-flex align-items-center justify-content-between w-100">
      <h2 class="m-0">Топ голосующих за {{ $moment().format('MMMM') }}</h2>
      <vs-button size="large" to="/cabinet/gifts">Голосовать</vs-button>
    </div>
    <div v-if="votesGifts.length">
      <h4 class="m-0">Что вы получите заняв призовое место?</h4>
      <div class="row d-flex justify-content-center my-3">
        <div v-for="vg in votesGifts" :key="vg.id" class="col-6 col-lg mb-2">
          <div class="mini-profile px-3 py-2" :class="'vote-gift-' + vg.place">
            <h3 class="m-0">{{ vg.place }} место</h3>
            <span v-text="$utils.formatCurrency(vg.bonus)" />
          </div>
        </div>
      </div>
    </div>
    <div ref="votes">
      <vs-table class="no-overflow-table mt-4 large-table">
        <template #thead>
          <vs-tr>
            <vs-th style="width: 4rem; max-width: 4rem">Место</vs-th>
            <vs-th style="width: 30%">Игрок</vs-th>
            <vs-th style="width: 30%">Голосов</vs-th>
            <vs-th>Последний голос</vs-th>
          </vs-tr>
        </template>
        <template #tbody>
          <vs-tr :key="vote.user.uuid" v-for="(vote, i) in votes.data" :data="vote">
            <vs-td>
              <h3 class="m-0">#{{ (votes.meta.total - 1) * 25 + i + 1 }}</h3>
            </vs-td>
            <vs-td>
              <div class="d-flex align-items-center">
                <Avatar class="rounded shadow me-3">
                  <SkinView2D class="rounded" :width="32" :height="32" :skin="vote.user.skin" />
                </Avatar>
                <nuxt-link :to="`/user/` + vote.user.username">{{ vote.user.username }}</nuxt-link>
              </div>
            </vs-td>
            <vs-td> {{ vote.total }} </vs-td>
            <vs-td> {{ $moment(vote.updated).local().format('DD.MM.YYYY, HH:mm:ss') }} </vs-td>
          </vs-tr>
        </template>
        <template #notFound>
          <span>Нет результатов</span>
        </template>
      </vs-table>
      <vs-pagination v-if="votes.data.length" class="mt-4" v-model="votes.meta.page" :length="votes.meta.total" />
    </div>
  </div>
</template>

<script>
export default {
  layout: 'cabinet',

  head: {
    title: 'Топ-голосующих',
  },

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Игроки')
  },

  data() {
    return {
      votesGifts: [],
      votes: {
        data: [],
        meta: {
          page: 1,
          total: 1,
        },
      },
    }
  },

  async fetch() {
    const loading = this.$vs.loading({ target: this.$refs.votes })
    this.votes = await this.$axios.get('players/votes-list', { params: { page: this.votes.meta.page } }).then((res) => res.data)
    this.votesGifts = await this.$axios.get('cabinet/votes/gifts').then((res) => res.data)
    loading.close()
  },

  methods: {
    async load() {
      const loading = this.$vs.loading({ target: this.$refs.votes })
      this.votes = await this.$axios.get('players/votes-list', { params: { page: this.votes.meta.page } }).then((res) => res.data)
      loading.close()
    },
  },

  watch: {
    'votes.meta.page': {
      handler: function () {
        this.load()
      },
    },
  },
}
</script>

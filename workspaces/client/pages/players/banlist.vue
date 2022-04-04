<template>
  <div class="px-4">
    <h2 class="m-0">Банлист</h2>
    <p class="mt-1 mb-2">
      В банлист попадают только плохие игроки, которые нарушили правила наших серверов. Избегайте бана! Следуйте
      <nuxt-link to="/page/rules">правилам проекта</nuxt-link> и никогда не будете забанены.
    </p>
    <div ref="banlist">
      <vs-table class="no-overflow-table mt-4 large-table">
        <template #thead>
          <vs-tr>
            <vs-th style="width: 25%">Игрок</vs-th>
            <vs-th style="width: 20%">Дата бана</vs-th>
            <vs-th style="width: 20%">Дата разбана</vs-th>
            <vs-th style="width: 25%">Модератор</vs-th>
            <vs-th>Причина</vs-th>
          </vs-tr>
        </template>
        <template #tbody>
          <vs-tr :key="ban.id" v-for="ban in banlist.data" :data="ban">
            <vs-td>
              <div class="d-flex align-items-center">
                <Avatar class="rounded shadow me-3">
                  <SkinView2D class="rounded" :width="32" :height="32" :skin="ban.user.skin" />
                </Avatar>
                <nuxt-link :to="`/user/` + ban.user.username">{{ ban.user.username }}</nuxt-link>
              </div>
            </vs-td>
            <vs-td> {{ $moment(ban.created).local().format('DD.MM.YYYY, HH:mm:ss') }} </vs-td>
            <vs-td> {{ ban.expires ? $moment(ban.expires).local().format('DD.MM.YYYY, HH:mm:ss') : 'Никогда' }} </vs-td>
            <vs-td v-if="ban.actor && ban.actor.username != 'Kernel'">
              <nuxt-link :to="`/user/` + ban.actor.username">{{ ban.actor.username }}</nuxt-link>
            </vs-td>
            <vs-td v-else> Консоль </vs-td>
            <vs-td> {{ ban.reason }} </vs-td>
          </vs-tr>
        </template>
        <template #notFound>
          <span>Нет результатов</span>
        </template>
      </vs-table>
      <vs-pagination v-if="banlist.data.length" class="mt-4" v-model="banlist.meta.currentPage" :length="banlist.meta.totalPages" />
    </div>
  </div>
</template>

<script>
import SkinViewer2D from '../../../admin/components/SkinView2D.vue'

export default {
  layout: 'cabinet',

  components: {
    SkinViewer2D,
  },

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Игроки')
  },

  data() {
    return {
      banlist: {
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
    this.banlist = await this.$axios.get('players/banlist').then((res) => res.data)
    loading.close()
  },

  watch: {
    'banlist.meta.currentPage': {
      handler: function () {
        this.$fetch()
      },
    },
  },
}
</script>

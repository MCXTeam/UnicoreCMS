<template>
  <div class="px-4">
    <h2 class="m-0">Топ онлайна</h2>
    <div ref="playtimes">
      <vs-table class="no-overflow-table mt-4 large-table">
        <template #thead>
          <vs-tr>
            <vs-th style="width: 4rem; max-width: 4rem">Место</vs-th>
            <vs-th style="width: 60%">Игрок</vs-th>
            <vs-th>Время в игре</vs-th>
          </vs-tr>
        </template>
        <template #tbody>
          <vs-tr :key="playtime.user.uuid" v-for="(playtime, i) in playtimes.data" :data="playtime">
            <vs-td> <h3 class="m-0">#{{ (playtimes.meta.page - 1) * 25 +  i + 1}}</h3> </vs-td>
            <vs-td>
              <div class="d-flex align-items-center">
                <Avatar class="rounded shadow me-3">
                  <SkinView2D class="rounded" :width="32" :height="32" :skin="playtime.user.skin" />
                </Avatar>
                <nuxt-link :to="`/user/` + playtime.user.username">{{ playtime.user.username }}</nuxt-link>
              </div>
            </vs-td>
            <vs-td> {{ $moment.duration(playtime.time, 'minutes').format('y [years], w [weeks], d [days], h [hours], m [minutes]') }} </vs-td>
          </vs-tr>
        </template>
        <template #notFound>
          <span>Нет результатов</span>
        </template>
      </vs-table>
      <vs-pagination v-if="playtimes.data.length" class="mt-4" v-model="playtimes.meta.page" :length="playtimes.meta.total" />
    </div>
  </div>
</template>

<script>
import SkinViewer2D from '../../../admin/components/SkinView2D.vue'

export default {
  layout: 'cabinet',

  head: {
    title: 'Топ-онлайн',
  },

  components: {
    SkinViewer2D,
  },

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Игроки')
  },

  data() {
    return {
      playtimes: {
        data: [],
        meta: {
          page: 1,
          total: 1,
        },
      },
    }
  },

  async fetch() {
    const loading = this.$vs.loading({ target: this.$refs.playtimes })
    this.playtimes = await this.$axios.get('players/playtime', { params: { page: this.playtimes.meta.page } }).then((res) => res.data)
    loading.close()
  },

  watch: {
    'playtimes.meta.page': {
      handler: function () {
        this.$fetch()
      },
    },
  },
}
</script>

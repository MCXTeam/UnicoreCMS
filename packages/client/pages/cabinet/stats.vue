<template>
  <section class="px-4">
    <h2 class="mt-0 mb-4">Статистика на серверах</h2>
    <div v-if="playtime && playtime.length">
      <div v-for="pt in playtime" :key="pt.server.id" class="d-flex align-items-center mb-4">
        <Avatar v-if="pt.server.icon" size="xlarge" :image="`${$config.apiUrl}/${pt.server.icon}`"> </Avatar>
        <Avatar v-else size="xlarge"> <i class="bx bxs-server"></i> </Avatar>
        <div class="ms-4">
          <h2 class="text-uppercase m-0" v-text="pt.server.name" />
          <span v-if="pt.time" v-text="$moment.duration(pt.time, 'minutes').format('y [years], w [weeks], d [days], h [hours], m [minutes]')" />
          <span v-else>Вы еще не играли на этом сервере</span>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="d-flex align-items-center mb-3" v-for="(n, index) in 3" :key="index">
        <Skeleton size="4rem"></Skeleton>
        <div class="ms-3" style="flex: 1">
          <Skeleton width="100%" class="mb-2"></Skeleton>
          <Skeleton width="75%"></Skeleton>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  layout: 'cabinet',

  data() {
    return {
      playtime: [],
    }
  },

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Личный кабинет')
  },

  async fetch() {
    this.playtime = await this.$axios.get('/cabinet/playtime/me').then((res) => res.data)
  },
}
</script>
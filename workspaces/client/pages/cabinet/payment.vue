<template>
  <section class="px-4">
    <h2 class="mt-0 mb-3">Пополнение счёта</h2>
    <div v-if="bonuses" class="row">
      <div v-for="bonus in bonuses" :key="bonus.id" class="col-sm-6 col-md-4 col-xl-3 mb-3">
        <div class="mini-profile p-4 d-flex flex-column align-items-center justify-content-end h-100">
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
  </section>
</template>

<script>
export default {
  layout: 'cabinet',

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Личный кабинет')
  },

  data() {
    return {
      bonuses: null,
    }
  },

  async fetch() {
    this.bonuses = await this.$axios.get('/payment/bonuses').then((res) => res.data)
  },
}
</script>

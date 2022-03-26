<template>

</template>

<script>
export default {
  layout: 'cabinet',

  data() {
    return {
      monitorings: []
    }
  },

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Личный кабинет')
  },

  async fetch() {
    this.monitorings = await this.$axios.get('cabinet/votes/monitorings').then(res => res.data)
  }
}
</script>

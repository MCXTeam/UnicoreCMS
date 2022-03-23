<template>
  <div class="px-4">
    <h2 class="m-0">Топ голосующих</h2>
  </div>
</template>

<script>
export default {
  layout: 'cabinet',

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Игроки')
  },
}
</script>

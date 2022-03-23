<template>
  <div class="px-4">
    <h2 class="m-0">Банлист</h2>
    <p class="mt-1 mb-2">
      В банлист попадают только плохие игроки, которые нарушили правила наших серверов. Избегайте бана! Следуйте <nuxt-link to="/rules">правилам проекта</nuxt-link> и никогда
      не будете забанены.
    </p>
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

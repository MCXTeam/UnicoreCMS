<template>

</template>

<script>
export default {
  layout: 'cabinet',

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Личный кабинет')
  },
}
</script>

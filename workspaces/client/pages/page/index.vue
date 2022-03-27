<template>
  <div class="panel description-html" v-html="page.content" />
</template>

<script>
export default {
  layout: 'landing',

  head() {
    return {
      title: this?.page?.title,
      desciption: this?.page?.description,
    }
  },

  async asyncData({ $axios, error, route, store }) {
    try {
      const page = await $axios.post(`/pages/path`, { path: route.params.pathMatch }).then((res) => res.data)
      store.commit('unicore/SET_NAME', page.title)

      return { page }
    } catch {
      error({ statusCode: 404 })
    }
  },
}
</script>

<template>
  <section>
    <div v-if="page" class="panel" v-html="page.content" />
    <div v-else>
      <Skeleton width="100%" height="40px" class="me-2 mb-3" v-for="(n, index) in 3" :key="index"></Skeleton>
    </div>
  </section>
</template>

<script>
export default {
  layout: 'landing',

  data() {
    return {
      page: null,
    }
  },

  head() {
    return {
      title: this?.page?.title,
      desciption: this?.page?.description
    }
  },

  async fetch() {
    try {
      this.page = await this.$axios.post(`/pages/path`, { path: this.$route.params.pathMatch }).then((res) => res.data)
      this.$store.commit('unicore/SET_NAME', this.page.title)
    } catch {
      this.$nuxt.error({ statusCode: 404 })
    }
  },
}
</script>
<template>
  <div class="panel description-html">
    <div v-if="news.image" class="news-image-full" :style="`background-image: url(${$config.apiUrl}/${news.image})`"></div>
    <div v-else class="news-image-full" style="background-image: url(/images/news.jpg)"></div>
    <div class="mt-4" v-text="news.description" />
    <div class="d-flex justify-content-end mt-4" v-text="$moment(news.created).local().format('D MMMM YYYY, HH:mm')" />
  </div>
</template>

<script>
export default {
  layout: 'landing',

  head() {
    return {
      title: this?.news?.title,
    }
  },

  async asyncData({ $axios, error, route, store }) {
    try {
      const news = await $axios.get(`/news/` + route.params.id).then((res) => res.data)
      store.commit('unicore/SET_NAME', news.title)

      return { news }
    } catch {
      error({ statusCode: 404 })
    }
  },
}
</script>

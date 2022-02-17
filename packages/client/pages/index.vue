<template>
  <section>
    <div v-for="news_ in news.data" :key="news_.id" class="mb-4 row news-block">
      <div class="col-md-5 news-content pb-3">
        <span class="text-lowercase">Новости</span>
        <h1 class="text-break" v-text="news_.title" />
        <p class="text-break" v-html="news_.description" />
        <span v-text="$moment(news_.created).local().format('D MMMM YYYY, HH:mm')"></span>
      </div>
      <div class="col pb-4">
        <div class="news-wrapper">
          <div v-if="news_.image" class="news-image" :style="`background-image: url(${$config.apiUrl}/${news_.image})`"></div>
          <div v-else class="news-image" style="background-image: url(/images/news.jpg)"></div>
        </div>
      </div>
    </div>
    <vs-pagination class="my-5" v-model="news.meta.currentPage" :length="news.meta.totalPages" />
  </section>
</template>

<script>
export default {
  data() {
    return {
      news: {
        data: [],
        meta: {
          itemsPerPage: 10,
          totalItems: 0,
          currentPage: 1,
          totalPages: 1,
        },
      },
    }
  },
  async fetch() {
    this.news = await this.$axios
      .get('/news', {
        params: {
          limit: this.news.meta.itemsPerPage,
          page: this.news.meta.currentPage,
        },
      })
      .then((res) => res.data)
  },
  watch: {
    'news.meta.currentPage': function () {
      this.$fetch()
    },
  },
}
</script>

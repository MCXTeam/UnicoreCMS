<template>
  <section>
    <div v-if="news.data">
      <div v-for="news_ in news.data" :key="news_.id" class="mb-4 row news-block">
        <div class="col-md-4 mb-4">
          <div class="news-wrapper">
            <div v-if="news_.image" class="news-image" :style="`background-image: url(${$config.apiUrl}/${news_.image})`"></div>
            <div v-else class="news-image" style="background-image: url(/images/news.jpg)"></div>
          </div>
        </div>
        <div class="col d-flex flex-column justify-content-between min-w-100 mb-4">
          <div>
            <h3 class="text-break mt-0 mb-2" v-text="news_.title" />
            <span class="text-break" v-html="news_.description"></span>
          </div>
          <div class="d-flex justify-content-between">
            <a href="#">Подробнее</a>
            <span class="text-break" v-text="$moment(news_.created).local().format('D MMMM YYYY, HH:mm')" />
          </div>
        </div>
      </div>
    </div>
    <div v-else id="news">
      <div class="row news-block" v-for="(n, index) in 3" :key="index">
        <div class="col-md-4">
          <Skeleton height="180px" width="100%" class="me-2 mb-3"></Skeleton>
        </div>
        <div class="col">
          <Skeleton width="50%" class="mb-2"></Skeleton>
          <Skeleton width="100%"></Skeleton>
        </div>
      </div>
    </div>
    <vs-pagination class="my-5" v-model="news.meta.currentPage" :length="news.meta.totalPages" />
  </section>
</template>

<script>
export default {
  layout: 'landing',

  async asyncData({ $axios }) {
    const news = await $axios
      .get('/news', {
        params: {
          limit: 10,
          page: 1,
        },
      })
      .then((res) => res.data)

    return { news }
  },

  methods: {
    async paginate() {
      this.news.data = null
      this.news = await this.$axios
        .get('/news', {
          params: {
            limit: this.news.meta.itemsPerPage,
            page: this.news.meta.currentPage,
          },
        })
        .then((res) => res.data)
    },
  },

  watch: {
    'news.meta.currentPage': function () {
      this.paginate()
    },
  },
}
</script>

<template>
  <section>
    <ExtensionSlot name="home.top" />

    <div v-if="news && news.data">
      <div v-for="news_ in news.data" :key="news_.id" class="mb-4 row news-block">
        <div class="col-md-4 mb-4">
          <div class="news-wrapper">
            <div v-if="news_.image" class="news-image" :style="`background-image: url(${$pub.apiBaseurl}/${news_.image})`"></div>
            <div v-else class="news-image" style="background-image: url(/images/news.jpg)"></div>
          </div>
        </div>
        <div class="col d-flex flex-column justify-content-between min-w-100 mb-4">
          <div>
            <h3 class="text-break mt-0 mb-2">
              <span v-text="news_.title" />
              <span v-if="news_.hidden" class="cab-badge ms-2">{{ $t('news.draft') }}</span>
            </h3>
            <span class="text-break" v-html="$sanitize(news_.description)"></span>
          </div>
          <div class="d-flex justify-content-between">
            <a v-if="news_.link" :href="news_.link" target="_blank">{{ $t('news.read_vk') }}</a>
            <NuxtLink v-else :to="`/news/${news_.id}`">{{ $t('common.more') }}</NuxtLink>
            <span class="text-break" v-text="$moment(news_.created).format('D MMMM YYYY, HH:mm')" />
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
    <Paginator
      v-if="news && news.meta"
      class="my-5"
      :rows="news.meta.itemsPerPage"
      :totalRecords="news.meta.totalItems"
      :first="(news.meta.currentPage - 1) * news.meta.itemsPerPage"
      @page="onPage"
    />

    <ExtensionSlot name="home.bottom" />
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const newsApi = useNews()

const { data: news } = await newsApi.list({ limit: 10, page: 1 })

async function onPage(event: any) {
  news.value.data = null
  news.value = await newsApi.fetchList({ limit: news.value.meta.itemsPerPage, page: event.page + 1 })
  nextTick(() => {
    window.scrollTo({ top: 700, behavior: 'smooth' })
  })
}
</script>

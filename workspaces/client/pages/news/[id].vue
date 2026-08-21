<template>
  <div v-if="news.full_size" class="description-html" v-html="$sanitize(news.description)" />
  <div v-else class="panel description-html">
    <div v-if="news.image" class="news-image-full" :style="`background-image: url(${$pub.apiBaseurl}/${news.image})`"></div>
    <div v-else class="news-image-full" style="background-image: url(/images/news.jpg)"></div>
    <div class="mt-4" v-html="$sanitize(news.description)" />
    <div class="d-flex justify-content-end mt-4" v-text="$moment(news.created).format('D MMMM YYYY, HH:mm')" />
  </div>
  <ExtensionSlot name="news.page" :news="news" />
</template>

<script setup lang="ts">
import { FULL_WIDTH_PAGE_CLASS } from '~/constants'
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'landing' })

const route = useRoute()

const { data: news, error } = await useNews().one(route.params.id as string)

if (error.value || !news.value) throw createError({ statusCode: 404, fatal: true })

useUiStore().setName(news.value.title)

useHead({
  title: news.value.title,
  htmlAttrs: { class: news.value.full_size ? FULL_WIDTH_PAGE_CLASS : '' },
  style: news.value.custom_css ? [{ innerHTML: String(news.value.custom_css) }] : [],
  script: news.value.custom_js ? [{ innerHTML: String(news.value.custom_js) }] : [],
})
</script>

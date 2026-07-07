<template>
  <div class="panel description-html">
    <div v-if="news.image" class="news-image-full" :style="`background-image: url(${$pub.apiBaseurl}/${news.image})`"></div>
    <div v-else class="news-image-full" style="background-image: url(/images/news.jpg)"></div>
    <div class="mt-4" v-html="$sanitize(news.description)" />
    <div class="d-flex justify-content-end mt-4" v-text="$moment(news.created).local().format('D MMMM YYYY, HH:mm')" />
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'landing' })

const { $api } = useNuxtApp()
const route = useRoute()

const { data: news, error } = await useAsyncData<any>(`news-${route.params.id}`, () =>
  $api.get(`/news/${route.params.id}`).then((res) => res.data),
)

if (error.value || !news.value) throw createError({ statusCode: 404, fatal: true })

useUiStore().setName(news.value.title)
useHead({ title: news.value.title })
</script>

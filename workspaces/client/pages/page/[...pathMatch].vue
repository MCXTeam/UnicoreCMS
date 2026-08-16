<template>
  <div :class="page.full_size ? 'description-html' : 'panel description-html'" v-html="$sanitize(page.content)" />
</template>

<script setup lang="ts">
import { FULL_WIDTH_PAGE_CLASS } from '~/constants'
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'landing' })

const { $api } = useNuxtApp()
const route = useRoute()

const path = Array.isArray(route.params.pathMatch) ? route.params.pathMatch.join('/') : route.params.pathMatch

const { data: page, error } = await useAsyncData<any>(`page-${path}`, () => $api.post('/pages/path', { path }).then((res) => res.data))

if (error.value || !page.value) throw createError({ statusCode: 404, fatal: true })

useUiStore().setName(page.value.title)
useHead({
  title: page.value.title,
  htmlAttrs: { class: page.value.full_size ? FULL_WIDTH_PAGE_CLASS : '' },
  meta: [{ name: 'description', content: page.value.description }],
  style: page.value.custom_css ? [{ innerHTML: String(page.value.custom_css) }] : [],
  script: page.value.custom_js ? [{ innerHTML: String(page.value.custom_js) }] : [],
})
</script>

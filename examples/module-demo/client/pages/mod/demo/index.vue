<template>
  <div class="panel description-html">
    <h2>{{ data?.greeting }}</h2>
    <ModDemoNotes :notes="data?.notes || []" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const { $api } = useNuxtApp()

const { data } = await useAsyncData<any>('mod-demo-notes', () => $api.get('/mod/demo/notes').then((res: any) => res.data))
</script>

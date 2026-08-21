<template>
  <div class="panel mt-4">
    <h3 class="mt-0">{{ $t('mod.demo.news_note_title') }}</h3>
    <p class="m-0">{{ $t('mod.demo.news_note', { title: news?.title || '' }) }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ news?: { title?: string } }>()
</script>

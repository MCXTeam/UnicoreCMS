<template>
  <div class="px-4">
    <h2 class="mt-0">{{ $t('mod.demo.cabinet_tab') }}</h2>
    <p class="m-0">{{ $t('mod.demo.cabinet_tab_text') }}</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'mod.demo.cabinet_tab' })
</script>

<template>
  <div class="card mt-3">
    <h5>{{ $t('mod.demo.user_notes') }}</h5>
    <p class="m-0">{{ $t('mod.demo.user_notes_text', { username: user?.username || '' }) }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ user?: { username?: string } }>()
</script>

<template>
  <div class="card">
    <h5>{{ title }}</h5>
    <p class="m-0">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; text: string }>()
</script>

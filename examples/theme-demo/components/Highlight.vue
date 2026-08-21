<template>
  <p class="theme-highlight">{{ text }}</p>
</template>

<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<style scoped>
.theme-highlight {
  color: rgb(var(--vs-primary));
  font-weight: 700;
}
</style>

<template>
  <div class="theme-noir-marquee">
    <span>{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<style scoped>
.theme-noir-marquee {
  border-left: 3px solid rgb(var(--vs-primary));
  padding-left: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
</style>

<template>
  <ul>
    <li v-for="note in notes" :key="note.id">{{ note.text }}</li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{ notes: { id: number; text: string }[] }>()
</script>

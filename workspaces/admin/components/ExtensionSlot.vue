<template>
  <component v-for="entry in entries" :key="`${entry.slot}-${entry.component}`" :is="entry.component" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { adminSlots } from 'unicore-api/admin'

const props = defineProps<{ name: string }>()

defineOptions({ inheritAttrs: false })

const entries = computed(() => adminSlots(props.name))
</script>

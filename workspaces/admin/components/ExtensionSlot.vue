<template>
  <component v-for="(entry, index) in entries" :key="`${entry.slot}-${index}`" :is="entry.component" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { adminSlots, type AdminSlotName } from 'unicore-api/admin'

const props = defineProps<{ name: AdminSlotName }>()

defineOptions({ inheritAttrs: false })

const entries = computed(() => adminSlots(props.name))
</script>

<template>
  <i v-if="!allowed" v-tooltip.right="$t('admin.field_forbidden')" class="pi pi-lock text-color-secondary field-lock" />
</template>

<script setup lang="ts">
defineProps<{ allowed?: boolean }>()

const { $t } = useNuxtApp() as any
</script>

<style scoped>
.field-lock {
  margin-left: 0.35rem;
  font-size: 0.8rem;
}
</style>

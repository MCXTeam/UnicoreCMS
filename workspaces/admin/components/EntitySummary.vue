<template>
  <div class="entity-summary">
    <Tag v-if="items.length" :value="items[0].name" />
    <span v-else class="text-color-secondary">—</span>
    <Button
      v-if="items.length > 1"
      :label="`+${items.length - 1}`"
      :aria-label="$t('admin.show_all_items', { count: items.length })"
      :aria-expanded="opened"
      :aria-controls="id"
      text
      size="small"
      @click="panel?.toggle($event)"
    />
    <Popover ref="panel" :id="id" @show="opened = true" @hide="opened = false">
      <ul class="entity-summary__all"><li v-for="item in items" :key="item.id">{{ item.name }}</li></ul>
    </Popover>
  </div>
</template>

<script setup lang="ts">
defineProps<{ items: { id: string | number; name: string }[] }>()
const id = useId()
const panel = ref()
const opened = ref(false)
</script>

<style scoped>
.entity-summary {
  display: flex;
  align-items: center;
  gap: 4px;
}
.entity-summary :deep(.p-button) {
  flex-shrink: 0;
}
.entity-summary :deep(.p-button-label) {
  white-space: nowrap;
  overflow-wrap: normal;
}
.entity-summary :deep(.p-tag) {
  max-width: 180px;
  white-space: normal;
  overflow-wrap: anywhere;
}
.entity-summary__all {
  margin: 0;
  padding: 0 0 0 20px;
  max-width: min(320px, calc(100vw - 64px));
  max-height: 240px;
  overflow: auto;
  overflow-wrap: anywhere;
}
.entity-summary__all li + li {
  margin-top: 8px;
}
</style>

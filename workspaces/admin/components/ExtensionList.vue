<template>
  <section class="extension-list" :aria-busy="loading">
    <header v-if="$slots.heading || $slots.actions" class="extension-list__header">
      <div class="extension-list__heading"><slot name="heading" /></div>
      <div class="extension-list__actions"><slot name="actions" /></div>
    </header>
    <div v-if="loading && !items.length" class="extension-list__loading" role="status" :aria-label="$t('common.loading')">
      <Skeleton v-for="n in 3" :key="n" height="96px" />
    </div>
    <ul v-else-if="items.length" class="extension-list__items">
      <li v-for="item in items" :key="item[itemKey]" class="extension-list__item">
        <div class="extension-list__summary"><slot name="summary" :item="item" /></div>
        <div class="extension-list__state"><slot name="state" :item="item" /></div>
        <div class="extension-list__item-actions"><slot name="item-actions" :item="item" /></div>
      </li>
    </ul>
    <div v-else class="py-4 text-center"><slot name="empty" /></div>
  </section>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
withDefaults(defineProps<{ items: T[]; loading?: boolean; itemKey?: string }>(), { loading: false, itemKey: 'id' })
</script>

<style scoped>
.extension-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}
.extension-list__heading {
  min-width: 0;
  flex: 1 1 240px;
}
.extension-list__actions,
.extension-list__item-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.extension-list__actions :deep(.p-button),
.extension-list__item-actions :deep(.p-button) {
  flex-shrink: 0;
}
.extension-list :deep(.p-button-label) {
  overflow-wrap: normal;
}
.extension-list__items {
  margin: 0;
  padding: 0;
  list-style: none;
}
.extension-list__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(144px, 200px) 200px;
  gap: 24px;
  align-items: center;
  padding: 24px 0;
  border-bottom: 1px solid var(--p-content-border-color);
}
.extension-list__item:last-child {
  border-bottom: 0;
}
.extension-list__summary,
.extension-list__state {
  min-width: 0;
  overflow-wrap: anywhere;
}
.extension-list__summary :deep(h3) {
  margin: 0 0 4px;
  font-size: 18px;
}
.extension-list__summary :deep(p) {
  margin: 8px 0 0;
  color: var(--p-text-muted-color);
  font-size: 14px;
  line-height: 1.5;
}
.extension-list__summary :deep(small) {
  color: var(--p-text-muted-color);
}
.extension-list__item-actions {
  justify-content: flex-start;
}
.extension-list__item-actions :deep(.p-button:not(.p-button-icon-only)) {
  width: 100%;
}
.extension-list__loading {
  display: grid;
  gap: 16px;
}
@media (max-width: 900px) {
  .extension-list__item {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
  .extension-list__item-actions :deep(.p-button:not(.p-button-icon-only)) {
    width: auto;
  }
}
</style>

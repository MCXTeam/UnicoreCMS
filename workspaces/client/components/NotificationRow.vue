<template>
  <component :is="tag" :to="item.link || undefined" class="nrow without-underline" :class="{ 'nrow--unread': !item.read }">
    <i class="nrow__icon" :class="item.icon || NOTIFICATION_DEFAULT_ICON"></i>
    <div class="nrow__body">
      <b>{{ text.title(item) }}</b>
      <span v-if="text.body(item)">{{ text.body(item) }}</span>
      <small>{{ text.when(item) }}</small>
    </div>
    <slot name="actions" />
  </component>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'
import { NOTIFICATION_DEFAULT_ICON, type NotificationView } from 'unicore-common/notifications'

const props = defineProps<{ item: NotificationView }>()

const text = useNotificationText()

const tag = computed(() => (props.item.link ? NuxtLink : 'div'))
</script>

<style scoped>
.nrow {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  color: inherit;
  cursor: pointer;
}
.nrow:hover {
  background: var(--p-content-hover-background);
}
.nrow--unread {
  background: var(--p-highlight-background);
}
.nrow__icon {
  margin-top: 2px;
  font-size: 1.25rem;
}
.nrow__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}
.nrow__body span {
  font-size: 0.9rem;
  opacity: 0.85;
}
.nrow__body small {
  font-size: 0.78rem;
  opacity: 0.6;
}
</style>

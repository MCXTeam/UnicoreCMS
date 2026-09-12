<template>
  <div class="nb">
    <button class="nb__btn" :aria-label="$t('notifications.title')" @click="toggle">
      <i class="bx bx-bell"></i>
      <span v-if="store.unread" class="nb__badge">{{ notificationBadge(store.unread) }}</span>
    </button>

    <Popover ref="panel" class="nb__panel">
      <div class="nb__head">
        <h4 class="m-0">{{ $t('notifications.title') }}</h4>
        <Button v-if="store.unread" size="small" text :label="$t('notifications.mark_all')" @click="markAll()" />
      </div>

      <div v-if="store.loading && !store.items.length" class="nb__list">
        <Skeleton v-for="n in 3" :key="n" height="56px" borderRadius="12px" />
      </div>
      <div v-else-if="visible.length" class="nb__list">
        <NotificationRow v-for="item in visible" :key="item.id" :item="item" @click="open(item)" />
      </div>
      <div v-else class="nb__empty">
        <i class="bx bx-bell-off"></i>
        <span>{{ $t('notifications.empty') }}</span>
      </div>

      <NuxtLink to="/cabinet/notifications" class="nb__all without-underline" @click="panel?.hide()">
        {{ $t('notifications.show_all') }}
      </NuxtLink>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { NOTIFICATION_BELL_LIMIT, notificationBadge, type NotificationView } from 'unicore-common/notifications'
import { useNotificationsStore } from '~/stores/notifications'

const { $auth, $t } = useNuxtApp() as any

const store = useNotificationsStore()

const panel = ref<any>(null)
const loaded = ref(false)

const visible = computed(() => store.items.slice(0, NOTIFICATION_BELL_LIMIT))

function load() {
  if (loaded.value) return

  loaded.value = true
  store.load()
}

function toggle(event: MouseEvent) {
  panel.value?.toggle(event)
  load()
}

function markAll() {
  store.markRead().catch(() => null)
}

function open(item: NotificationView) {
  if (!item.read) store.markRead([item.id]).catch(() => null)

  if (item.link) panel.value?.hide()
}

onMounted(() => {
  if ($auth.loggedIn) load()
})
</script>

<style scoped>
.nb {
  display: inline-flex;
}
.nb__btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: none;
  color: inherit;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}
.nb__btn:hover {
  background: var(--p-content-hover-background);
}
.nb__badge {
  position: absolute;
  top: 2px;
  right: 0;
  min-width: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: var(--p-red-500);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}
.nb__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.nb__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 420px;
  overflow-y: auto;
}
.nb__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 26px 10px;
  opacity: 0.7;
}
.nb__empty i {
  font-size: 1.8rem;
}
.nb__all {
  display: block;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--p-content-border-color);
  text-align: center;
}
</style>

<style>
.nb__panel {
  width: min(380px, calc(100vw - 24px));
}
</style>

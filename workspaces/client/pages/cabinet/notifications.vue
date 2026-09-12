<template>
  <div class="cab-grid">
    <CabTile :title="$t('notifications.title')" icon="bx bx-bell" :span="7">
      <template #actions>
        <Button v-if="store.unread" size="small" text :label="$t('notifications.mark_all')" @click="markAll()" />
        <Button
          v-if="store.items.length"
          size="small"
          text
          severity="danger"
          :label="confirming ? $t('notifications.clear_confirm') : $t('notifications.clear')"
          @click="clear()"
        />
      </template>

      <div v-if="store.loading && !store.items.length" class="cab-feed">
        <Skeleton v-for="n in 4" :key="n" height="62px" borderRadius="14px" />
      </div>
      <div v-else-if="store.items.length" class="cab-feed">
        <NotificationRow v-for="item in store.items" :key="item.id" :item="item" @click="open(item)">
          <template #actions>
            <Button
              class="cab-feed__remove"
              size="small"
              text
              severity="danger"
              v-tooltip.top="$t('notifications.remove')"
              @click.stop.prevent="remove(item.id)"
            >
              <i class="bx bx-trash"></i>
            </Button>
          </template>
        </NotificationRow>
      </div>
      <div v-else class="cab-empty">
        <i class="bx bx-bell-off"></i>
        <span>{{ $t('notifications.empty') }}</span>
      </div>

      <template #footer>
        <Button
          v-if="store.hasMore"
          class="w-100"
          outlined
          :loading="store.loading"
          :label="$t('notifications.more')"
          @click="store.load(true)"
        />
      </template>
    </CabTile>

    <CabTile :title="$t('notifications.settings_title')" icon="bx bx-slider-alt" :span="5">
      <p class="cab-sub mt-0 mb-3">{{ $t('notifications.settings_hint') }}</p>

      <div v-if="categories === null" class="cab-feed">
        <Skeleton v-for="n in 2" :key="n" height="48px" borderRadius="14px" />
      </div>
      <div v-else class="cab-feed">
        <div v-for="category in categories" :key="category.id" class="cab-toggle">
          <i :class="category.icon || NOTIFICATION_DEFAULT_ICON"></i>
          <div class="cab-toggle__text">
            <b>{{ $t(category.labelKey) }}</b>
            <span v-if="category.hintKey">{{ $t(category.hintKey) }}</span>
          </div>
          <ToggleSwitch :modelValue="category.enabled" @update:modelValue="toggle(category, $event)" />
        </div>
      </div>
    </CabTile>
  </div>
</template>

<script setup>
import { NOTIFICATION_DEFAULT_ICON } from 'unicore-common/notifications'
import { useNotificationsStore } from '~/stores/notifications'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'verify'],
  title: 'notifications.tab',
  hint: 'notifications.tab_hint',
})

const { $t, $unicore } = useNuxtApp()

const api = useNotifications()
const store = useNotificationsStore()

useHead({ title: computed(() => $t('notifications.tab')) })

const categories = ref(null)
const confirming = ref(false)

onMounted(async () => {
  await store.load()

  categories.value = await api.settings().catch(() => [])
})

function open(item) {
  if (!item.read) store.markRead([item.id]).catch(() => null)
}

async function markAll() {
  await store.markRead().catch(() => $unicore.errorNotification($t('error.title')))
}

async function remove(id) {
  await store.remove(id).catch(() => $unicore.errorNotification($t('error.title')))
}

async function toggle(category, enabled) {
  category.enabled = enabled

  try {
    categories.value = await api.setCategory(category.id, enabled)
  } catch {
    category.enabled = !enabled
    $unicore.errorNotification($t('error.title'))
  }
}

async function clear() {
  if (!confirming.value) {
    confirming.value = true

    return
  }

  confirming.value = false

  await store.clear().catch(() => null)
}
</script>

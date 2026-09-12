import { defineStore } from 'pinia'
import { NOTIFICATION_PAGE_SIZE, type NotificationView } from 'unicore-common/notifications'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    items: [] as NotificationView[],
    unread: 0,
    total: 0,
    page: 0,
    loading: false,
  }),
  getters: {
    hasMore: (state) => state.items.length < state.total,
  },
  actions: {
    reset() {
      this.items = []
      this.unread = 0
      this.total = 0
      this.page = 0
      this.loading = false
    },
    async load(next = false) {
      if (this.loading) return

      const page = next ? this.page + 1 : 1
      const before = next ? this.items[this.items.length - 1]?.id : undefined

      this.loading = true

      try {
        const feed = await useNotifications().feed(page, NOTIFICATION_PAGE_SIZE, before)

        if (page === 1) this.items = feed.items
        else {
          const known = new Set(this.items.map((item) => item.id))

          this.items = [...this.items, ...feed.items.filter((item) => !known.has(item.id))]
        }

        this.unread = feed.unread
        this.total = feed.total
        this.page = page
      } catch {
        if (page === 1) this.items = []
      }

      this.loading = false
    },
    receive(item: NotificationView) {
      if (this.items.some((existing) => existing.id === item.id)) return

      this.items = [item, ...this.items]
      this.total += 1
    },
    setUnread(value: number) {
      this.unread = Math.max(0, Number(value) || 0)
    },
    async markRead(ids?: number[]) {
      const target = ids?.length ? this.items.filter((item) => ids.includes(item.id)) : this.items

      const pending = target.filter((item) => !item.read)

      if (!pending.length) return

      for (const item of pending) item.read = true

      try {
        const { unread } = await useNotifications().markRead(ids)

        this.setUnread(unread)
      } catch (error) {
        for (const item of pending) item.read = false

        throw error
      }
    },
    async remove(id: number) {
      const { unread } = await useNotifications().remove(id)

      this.items = this.items.filter((item) => item.id !== id)
      this.total = Math.max(0, this.total - 1)
      this.setUnread(unread)
    },
    async clear() {
      await useNotifications().clear()

      this.items = []
      this.total = 0
      this.setUnread(0)
      this.page = 1
    },
  },
})

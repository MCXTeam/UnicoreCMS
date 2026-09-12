import type { NotificationCategoryView, NotificationFeed } from 'unicore-common/notifications'

export const useNotifications = () => {
  const api = useApi()

  return {
    feed: (page: number, limit: number, before?: number): Promise<NotificationFeed> =>
      api.get('/cabinet/notifications', { params: { page, limit, before } }).then((res) => res.data),
    markRead: (ids?: number[]) => api.post('/cabinet/notifications/read', ids ? { ids } : {}).then((res) => res.data),
    remove: (id: number) => api.delete(`/cabinet/notifications/${id}`).then((res) => res.data),
    clear: () => api.delete('/cabinet/notifications').then((res) => res.data),
    settings: (): Promise<NotificationCategoryView[]> => api.get('/cabinet/notifications/settings').then((res) => res.data),
    setCategory: (category: string, enabled: boolean): Promise<NotificationCategoryView[]> =>
      api.patch('/cabinet/notifications/settings', { category, enabled }).then((res) => res.data),
  }
}

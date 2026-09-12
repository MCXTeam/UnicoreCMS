import { io } from 'socket.io-client'
import { csrfToken } from 'unicore-common/auth'
import { NOTIFICATION_EVENT_NEW, NOTIFICATION_EVENT_STATE, type NotificationView } from 'unicore-common/notifications'
import { useAuthStore } from '~/stores/auth'
import { useIoStore } from '~/stores/io'
import { useLayoutStore } from '~/stores/layout'
import { useNotificationsStore } from '~/stores/notifications'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const ioStore = useIoStore()
  const layoutStore = useLayoutStore()
  const notifications = useNotificationsStore()

  const credentials = () => ({ token: auth.refreshToken || '', csrf: csrfToken() })

  const socket = io(config.public.apiBaseurl, {
    transports: ['polling', 'websocket'],
    withCredentials: true,
    auth: (done) => done(credentials()),
  })

  socket.on('servers/online', (data: any) => ioStore.setServersOnline(data))
  socket.on('layout/updated', () => layoutStore.fetch().catch(() => null))
  socket.on(NOTIFICATION_EVENT_NEW, (data: NotificationView) => notifications.receive(data))
  socket.on(NOTIFICATION_EVENT_STATE, (data: { unread: number }) => notifications.setUnread(data?.unread ?? 0))

  watch(
    () => auth.user?.uuid,
    () => {
      socket.disconnect().connect()

      if (!auth.loggedIn) notifications.reset()
    },
  )

  return { provide: { socket } }
})

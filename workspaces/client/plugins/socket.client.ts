import { io } from 'socket.io-client'
import { useIoStore } from '~/stores/io'
import { useLayoutStore } from '~/stores/layout'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const ioStore = useIoStore()
  const layoutStore = useLayoutStore()

  const socket = io(config.public.apiBaseurl, { transports: ['polling', 'websocket'] })

  socket.on('servers/online', (data: any) => ioStore.setServersOnline(data))
  socket.on('layout/updated', () => layoutStore.fetch().catch(() => null))

  return { provide: { socket } }
})

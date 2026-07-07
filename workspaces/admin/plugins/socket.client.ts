import { io } from 'socket.io-client'
import { useIoStore } from '~/stores/io'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const ioStore = useIoStore()

  const socket = io(config.public.apiBaseurl, { transports: ['websocket'] })

  socket.on('servers/online', (data: any) => ioStore.setServersOnline(data))

  return { provide: { socket } }
})

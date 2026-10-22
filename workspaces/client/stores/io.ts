import { defineStore } from 'pinia'

export const useIoStore = defineStore('io', {
  state: () => ({
    serversOnline: {
      servers: null,
      total: {
        online: null,
        records: {
          absolute: { online: 0, created: null },
          today: { online: 0, created: null },
        },
      },
    } as any,
  }),
  actions: {
    setServersOnline(value: any) {
      if (Array.isArray(value?.servers) && value?.total) this.serversOnline = value
    },
    markOnlineUnknown() {
      this.serversOnline.servers ??= []
      this.serversOnline.total.online = null
      this.serversOnline.total.freshness = 'stale'
      for (const server of this.serversOnline.servers || []) {
        server.players = null
        server.online = null
        server.freshness = 'stale'
        server.playerList = []
        for (const instance of server.server?.instances || []) { instance.online = null; instance.players = null }
      }
    },
  },
})

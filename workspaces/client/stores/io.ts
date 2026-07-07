import { defineStore } from 'pinia'

export const useIoStore = defineStore('io', {
  state: () => ({
    serversOnline: {
      servers: null,
      total: {
        online: 0,
        records: {
          absolute: 0,
          today: 0,
        },
      },
    } as any,
  }),
  actions: {
    setServersOnline(value: any) {
      this.serversOnline = value
    },
  },
})

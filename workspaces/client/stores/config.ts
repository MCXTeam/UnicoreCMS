import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', {
  state: () => ({
    config: {} as Record<string, number | string | boolean>,
  }),
  actions: {
    setConfig(value: Record<string, number | string | boolean>) {
      this.config = value
    },
    async fetch() {
      const { $api } = useNuxtApp()
      const { data } = await $api.get('/config/public')
      this.setConfig(data)
      return data
    },
  },
})

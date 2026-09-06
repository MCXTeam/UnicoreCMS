import { defineStore } from 'pinia'
import { DEFAULT_LAYOUT } from 'unicore-common/layout-presets'
import type { LayoutDefinition, LayoutPlace, LayoutState } from 'unicore-common/layout'

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    layout: { ...DEFAULT_LAYOUT } as LayoutState,
  }),
  getters: {
    place:
      (state) =>
      (place: LayoutPlace): LayoutDefinition =>
        state.layout[place] || DEFAULT_LAYOUT[place],
  },
  actions: {
    setLayout(value: Partial<LayoutState> | null) {
      this.layout = { ...DEFAULT_LAYOUT, ...(value || {}) }
    },
    async fetch() {
      const { $api } = useNuxtApp()
      const { data } = await $api.get('/layouts')

      this.setLayout(data)

      return data
    },
  },
})

import { defineStore } from 'pinia'

export type StoreSidebarName = 'CartSidebar' | 'StoreProductsSidebar' | 'WarehouseSidebar'

export interface StoreSidebar {
  component: StoreSidebarName
  payload?: Record<string, any>
}

export interface StoreFilters {
  price?: number[]
  sort?: string
  category?: number
  search?: string
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    loadingCount: 0,
    loadingText: '' as string,
    pageName: '' as string,
    storeSidebar: null as StoreSidebar | null,
    storeFilters: null as StoreFilters | null,
  }),
  getters: {
    loading: (state) => state.loadingCount > 0,
  },
  actions: {
    setName(name: string) {
      this.pageName = name
    },
    startLoading(text = '') {
      this.loadingCount++
      this.loadingText = text
    },
    stopLoading() {
      if (this.loadingCount > 0) this.loadingCount--
      if (this.loadingCount === 0) this.loadingText = ''
    },
    setStoreSidebar(sidebar: StoreSidebar | null) {
      this.storeSidebar = sidebar
    },
    setStoreSidebarLoading(loading: boolean) {
      if (this.storeSidebar)
        this.storeSidebar = {
          ...this.storeSidebar,
          payload: { ...this.storeSidebar.payload, loading },
        }
    },
    setStoreFilters(filters: StoreFilters) {
      this.storeFilters = filters
    },
  },
})

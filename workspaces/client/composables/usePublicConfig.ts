import { useConfigStore } from '~/stores/config'

export const usePublicConfig = () => {
  const store = useConfigStore()

  return {
    config: computed(() => store.config),
    value: (key: string, fallback: string | number | boolean = '') => store.config?.[key] ?? fallback,
    text: (key: string, fallback = '') => String(store.config?.[key] ?? fallback),
    refresh: () => store.fetch(),
  }
}

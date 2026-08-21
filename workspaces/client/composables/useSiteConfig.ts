import { useConfigStore } from '~/stores/config'

export const useSiteConfig = () => {
  const store = useConfigStore()

  return {
    config: computed(() => store.config),
    value: (key: string, fallback: string | number | boolean = '') => store.config?.[key] ?? fallback,
    refresh: () => store.fetch(),
  }
}

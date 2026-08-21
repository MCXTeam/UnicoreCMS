import type { AxiosInstance } from 'axios'

export const useApi = (): AxiosInstance => useNuxtApp().$api as AxiosInstance

export const useAssetUrl = () => {
  const base = useRuntimeConfig().public.apiBaseurl

  return (path?: string | null, fallback = ''): string => (path ? `${base}/${path}` : fallback)
}

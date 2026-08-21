export const useWarehouse = () => {
  const api = useApi()

  return {
    servers: () => api.get('/store/warehouse/servers').then((res) => res.data),
    items: (serverId: string | number, params: Record<string, unknown> = {}) =>
      api.get(`/store/warehouse/${serverId}`, { params }).then((res) => res.data),
  }
}

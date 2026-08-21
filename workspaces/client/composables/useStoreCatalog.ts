export const useStoreCatalog = () => {
  const api = useApi()

  const servers = () => api.get('/store/products/protected/servers').then((res) => res.data)

  const server = (serverId: string | number) => api.get(`/store/products/protected/servers/${serverId}`).then((res) => res.data)

  const products = (params: Record<string, unknown> = {}) =>
    api.get('/store/products/protected/products', { params }).then((res) => res.data)

  const kit = (id: string | number) => api.get(`/store/products/protected/kit/${id}`).then((res) => res.data)

  return { servers, server, products, kit }
}

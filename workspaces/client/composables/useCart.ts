export const useCart = () => {
  const api = useApi()

  const load = (serverId: string | number) => api.get(`/store/cart/${serverId}`).then((res) => res.data)

  const servers = () => api.get('/store/cart/servers').then((res) => res.data)

  const remove = (type: string, id: number) => api.delete(`/store/cart/item/${type}/${id}`).then((res) => res.data)

  const clear = (serverId: string | number) => api.delete(`/store/cart/server/${serverId}`).then((res) => res.data)

  const add = (payload: Record<string, unknown>) => api.post('/store/cart/add', payload).then((res) => res.data)

  const buy = (payload: Record<string, unknown>) => api.post('/store/cart/buy', payload).then((res) => res.data)

  return { load, servers, remove, clear, add, buy }
}

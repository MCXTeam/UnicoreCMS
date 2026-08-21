export const useServers = () => {
  const api = useApi()

  const fetchList = () => api.get('/servers').then((res) => res.data)

  const list = (key = 'servers') => useAsyncData<any[]>(key, fetchList)

  const one = (id: string | number) => useAsyncData<any>(`server-${id}`, () => api.get(`/servers/${id}`).then((res) => res.data))

  const gallery = (id: string | number) =>
    useAsyncData<any[]>(`server-gallery-${id}`, () => api.get(`/servers/${id}/gallery`).then((res) => res.data), {
      default: () => [] as any[],
    })

  return { list, one, gallery, fetchList }
}

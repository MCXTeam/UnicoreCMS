export const useNews = () => {
  const api = useApi()
  const auth = useAuthStore()

  const fetchList = (params: Record<string, unknown> = {}) => api.get('/news', { params }).then((res) => res.data)

  const list = (params: Record<string, unknown> = {}, key = 'index-news') => {
    const authorized = import.meta.client && auth.loggedIn

    return useAsyncData<any>(authorized ? `${key}-auth` : key, () => fetchList(params), { server: !authorized })
  }

  const one = (id: string | number) => useAsyncData<any>(`news-${id}`, () => api.get(`/news/${id}`).then((res) => res.data))

  return { list, one, fetchList }
}

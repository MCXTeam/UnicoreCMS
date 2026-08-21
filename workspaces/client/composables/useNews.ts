export const useNews = () => {
  const api = useApi()

  const fetchList = (params: Record<string, unknown> = {}) => api.get('/news', { params }).then((res) => res.data)

  const list = (params: Record<string, unknown> = {}, key = 'index-news') => useAsyncData<any>(key, () => fetchList(params))

  const one = (id: string | number) => useAsyncData<any>(`news-${id}`, () => api.get(`/news/${id}`).then((res) => res.data))

  return { list, one, fetchList }
}

export const usePages = () => {
  const api = useApi()

  return {
    rules: () => api.get('/pages/rules').then((res) => res.data),
    byPath: (path: string) => useAsyncData<any>(`page-${path}`, () => api.post('/pages/path', { path }).then((res) => res.data)),
  }
}

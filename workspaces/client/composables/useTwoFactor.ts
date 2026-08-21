export const useTwoFactor = () => {
  const api = useApi()

  return {
    generate: () => api.get('/cabinet/2fa/generate').then((res) => res.data),
    enable: (code: string) => api.post('/cabinet/2fa/enable', { code }).then((res) => res.data),
    disable: (code: string) => api.post('/cabinet/2fa/disable', { code }).then((res) => res.data),
  }
}

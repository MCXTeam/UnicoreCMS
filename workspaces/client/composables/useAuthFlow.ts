const recaptchaHeaders = (token?: string) => (token ? { headers: { recaptcha: token } } : {})

export const useAuthFlow = () => {
  const api = useApi()

  return {
    register: (payload: Record<string, unknown>, recaptcha?: string) =>
      api.post('/auth/register', payload, recaptchaHeaders(recaptcha)).then((res) => res.data),
    reset: (payload: Record<string, unknown>) => api.post('/auth/reset', payload).then((res) => res.data),
    password: (payload: Record<string, unknown>) => api.post('/auth/password', payload).then((res) => res.data),
    verify: (payload: Record<string, unknown>, recaptcha?: string) =>
      api.post('/auth/verify', payload, recaptchaHeaders(recaptcha)).then((res) => res.data),
    resend: () => api.get('/auth/resend').then((res) => res.data),
  }
}

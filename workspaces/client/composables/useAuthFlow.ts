const recaptchaHeaders = (token?: string) => (token ? { headers: { recaptcha: token } } : {})

export const useAuthFlow = () => {
  const api = useApi()
  const executeRecaptcha = useAuthRecaptcha()

  const resetRequest = async (path: string, payload: Record<string, unknown>) => {
    const token = await executeRecaptcha('reset')
    return api.post(path, payload, { ...recaptchaHeaders(token), timeout: 30_000 }).then((res) => res.data)
  }

  return {
    register: (payload: Record<string, unknown>, recaptcha?: string) =>
      api.post('/auth/register', payload, recaptchaHeaders(recaptcha)).then((res) => res.data),
    reset: (payload: Record<string, unknown>) => resetRequest('/auth/reset', payload),
    password: (payload: Record<string, unknown>) => resetRequest('/auth/password', payload),
    verify: (payload: Record<string, unknown>, recaptcha?: string) =>
      api.post('/auth/verify', payload, recaptchaHeaders(recaptcha)).then((res) => res.data),
    resend: () => api.get('/auth/resend').then((res) => res.data),
  }
}

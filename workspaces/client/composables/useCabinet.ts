export const useCabinet = () => {
  const api = useApi()

  return {
    history: (params: Record<string, unknown> = {}) => api.get('/cabinet/history/me', { params }).then((res) => res.data),
    playtime: () => api.get('/cabinet/playtime/me').then((res) => res.data),
    referals: () => api.get('/cabinet/referals/me').then((res) => res.data),
    inviter: () => api.get('/cabinet/referals/me/inviter').then((res) => res.data),
    sessions: (token: string) => api.post('/auth/sessions/me', { token }).then((res) => res.data),
    closeSession: (id: number | string) => api.delete(`/auth/sessions/${id}`).then((res) => res.data),
    closeAllSessions: () => api.delete('/auth/sessions_all').then((res) => res.data),
    closeOtherSessions: (token: string) => api.delete('/auth/sessions_other', { data: { token } }).then((res) => res.data),
    changePassword: (payload: Record<string, unknown>) => api.post('/cabinet/settings/password', payload).then((res) => res.data),
    activateGift: (gift_code: string, recaptcha?: string) =>
      api
        .post('/cabinet/gifts/activate', { gift_code }, recaptcha ? { headers: { recaptcha } } : {})
        .then((res) => res.data),
    unban: () => api.post('/bans/unban').then((res) => res.data),
  }
}

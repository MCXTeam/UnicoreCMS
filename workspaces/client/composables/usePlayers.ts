export const usePlayers = () => {
  const api = useApi()

  return {
    banlist: (params: Record<string, unknown> = {}) => api.get('players/banlist', { params }).then((res) => res.data),
    playtime: (params: Record<string, unknown> = {}) => api.get('players/playtime', { params }).then((res) => res.data),
    profile: (username: string) => api.get(`/users/public/user/${username}`).then((res) => res.data),
    count: () => useAsyncData<number>('users-count', () => api.get('/users/count').then((res) => res.data), { default: () => 0 }),
  }
}

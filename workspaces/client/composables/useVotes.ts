export const useVotes = () => {
  const api = useApi()

  return {
    monitorings: () => api.get('cabinet/votes/monitorings').then((res) => res.data),
    gifts: () => api.get('cabinet/votes/gifts').then((res) => res.data),
    list: (params: Record<string, unknown> = {}) => api.get('players/votes-list', { params }).then((res) => res.data),
  }
}

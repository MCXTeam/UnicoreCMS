export const useDonate = () => {
  const api = useApi()

  return {
    myGroups: () => api.get('/donates/groups/me').then((res) => res.data),
    myPermissions: () => api.get('/donates/permissions/me').then((res) => res.data),
    groupsByServer: (serverId: string | number) => api.get(`/donates/groups/server/${serverId}`).then((res) => res.data),
    permissionsByServer: (serverId: string | number) => api.get(`/donates/permissions/server/${serverId}`).then((res) => res.data),
    buyGroup: (payload: Record<string, unknown>) => api.post('/donates/groups/buy', payload).then((res) => res.data),
    buyPermission: (payload: Record<string, unknown>) => api.post('/donates/permissions/buy', payload).then((res) => res.data),
    page: (id: string | number) =>
      useAsyncData<any>(`donate-${id}`, async () => {
        const [server, donates] = await Promise.all([
          api.get(`/servers/${id}`).then((res) => res.data),
          api.get(`/donates/groups/server/${id}`).then((res) => res.data),
        ])

        return { server, donates }
      }),
  }
}

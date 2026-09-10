export const useKitContent = () => {
  const { $pub } = useNuxtApp() as any

  const override = (kit: any, serverId: string) => (kit?.servers || []).find((row: any) => row.server?.id == serverId) || null

  const description = (kit: any, serverId: string) => override(kit, serverId)?.description || kit?.description || ''

  const image = (kit: any, serverId: string) => {
    const file = override(kit, serverId)?.image

    return file ? `${$pub.apiBaseurl}/${file}` : null
  }

  return { description, image }
}

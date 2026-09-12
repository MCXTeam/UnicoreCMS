export default defineNuxtPlugin((nuxtApp) => {
  const { $api } = nuxtApp as any

  async function uploadImage(file: File): Promise<string> {
    const payload = new FormData()

    payload.append('file', file)

    const { data } = await $api.post('/storage/image', payload, { headers: { 'Content-Type': 'multipart/form-data' } })

    return data.url
  }

  return { provide: { uploadImage } }
})

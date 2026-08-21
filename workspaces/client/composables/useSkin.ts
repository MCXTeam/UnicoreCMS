const multipart = { headers: { 'Content-Type': 'multipart/form-data' } }

export const useSkin = () => {
  const api = useApi()

  return {
    uploadSkin: (form: FormData) => api.patch('/cabinet/skin/skin', form, multipart).then((res) => res.data),
    uploadCloak: (form: FormData) => api.patch('/cabinet/skin/cloak', form, multipart).then((res) => res.data),
    removeSkin: () => api.delete('/cabinet/skin/skin').then((res) => res.data),
    removeCloak: () => api.delete('/cabinet/skin/cloak').then((res) => res.data),
  }
}

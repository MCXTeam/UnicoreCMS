import { IMAGE_FALLBACK } from '~/constants'

export default defineNuxtPlugin(() => {
  document.addEventListener(
    'error',
    (event) => {
      const image = event.target as HTMLImageElement

      if (!(image instanceof HTMLImageElement) || image.dataset.fallback || image.closest('.p-avatar')) return

      image.dataset.fallback = '1'
      image.src = IMAGE_FALLBACK
    },
    true,
  )
})

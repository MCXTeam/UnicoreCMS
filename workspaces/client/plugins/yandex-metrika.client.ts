import { YANDEX_METRIKA_INIT_OPTIONS, YANDEX_METRIKA_SCRIPT } from '~/constants'

declare global {
  interface Window {
    ym?: ((id: number, action: string, ...args: unknown[]) => void) & { a?: unknown[]; l?: number }
  }
}

const loadMetrika = () => {
  if (window.ym) return

  const stub = ((...args: unknown[]) => {
    stub.a = stub.a || []
    stub.a.push(args)
  }) as NonNullable<Window['ym']>

  stub.l = Date.now()
  window.ym = stub

  const script = document.createElement('script')
  script.src = YANDEX_METRIKA_SCRIPT
  script.async = true
  document.head.appendChild(script)
}

export default defineNuxtPlugin(() => {
  const id = Number(useRuntimeConfig().public.yandexMetrikaId)
  if (!Number.isInteger(id) || id <= 0) return

  loadMetrika()
  window.ym?.(id, 'init', YANDEX_METRIKA_INIT_OPTIONS)

  useRouter().afterEach((to, from) => {
    if (to.fullPath === from.fullPath) return
    window.ym?.(id, 'hit', to.fullPath, { referer: from.fullPath })
  })
})

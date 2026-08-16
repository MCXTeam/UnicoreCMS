export const PAYMENT_POLL_ATTEMPTS = 10
export const PAYMENT_POLL_INTERVAL_MS = 3000

export const FULL_WIDTH_PAGE_CLASS = 'full-width-page'

export const IMAGE_FALLBACK = '/images/placeholder.svg'

export const KIT_HIDE_DELAY_MS = 250

export const SITEMAP_USERS_MAX_PAGES = 50

export const PRIVATE_ROUTES = ['/auth', '/cabinet', '/store', '/players']
export const SITEMAP_EXCLUDE = [...PRIVATE_ROUTES.map((route) => `${route}/**`), '/page']

export const YANDEX_METRIKA_SCRIPT = 'https://mc.yandex.ru/metrika/tag.js'

export const YANDEX_METRIKA_INIT_OPTIONS = {
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  webvisor: true,
}

export { SANITIZE_CONFIG } from 'unicore-common/sanitize'

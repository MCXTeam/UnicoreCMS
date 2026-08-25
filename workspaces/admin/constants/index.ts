export * from './access'
export * from './config-hints'

export const DASHBOARD_CHART_SECTIONS = [
  { key: 'online_records', label: 'admin.chart_online', field: 'amount', color: '#e91e63' },
  { key: 'purchases', label: 'admin.chart_purchases', field: 'count', color: '#3f51b5' },
  { key: 'payments', label: 'admin.chart_payments', field: 'count', color: '#f57c00' },
  { key: 'users', label: 'admin.chart_users', field: 'count', color: '#9c27b0' },
]

export const IMAGE_FALLBACK = '/placeholder.svg'

export const REBUILD_POLL_MS = 2000

export const fullSizeTemplate = (heading: string, text: string) =>
  `<div class="panel description-html">\n  <h2>${heading}</h2>\n  <p>${text}</p>\n</div>`

export { SANITIZE_CONFIG } from 'unicore-common/sanitize'

export { RCON_FIELD_MAP } from 'unicore-common/issuance'

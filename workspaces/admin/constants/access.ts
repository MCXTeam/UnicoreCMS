import { Permission } from 'unicore-common/enums'

export const SUPERUSER_ONLY = 'superuser'

export type RouteAccess = typeof SUPERUSER_ONLY | Permission[]

export const ROUTE_ACCESS: Record<string, RouteAccess> = {
  '/': [Permission.AdminDashboard],
  '/users': [Permission.AdminUsersRead],
  '/revenue': [Permission.AdminDashboardRevenue],
  '/roles': SUPERUSER_ONLY,
  '/config': SUPERUSER_ONLY,
  '/locales': SUPERUSER_ONLY,
  '/api': SUPERUSER_ONLY,
  '/news': [
    Permission.EditorNewsCreate,
    Permission.EditorNewsUpdate,
    Permission.EditorNewsDelete,
    Permission.EditorNewsDeleteMany,
  ],
  '/pages': [Permission.AdminPagesRead],
  '/email': [Permission.AdminEmailRead],
  '/servers': [Permission.AdminServersCreate, Permission.AdminServersUpdate, Permission.AdminServersDelete],
  '/mods': [
    Permission.EditorModsCreate,
    Permission.EditorModsUpdate,
    Permission.EditorModsDelete,
    Permission.EditorModsDeleteMany,
  ],
  '/webhooks': [Permission.AdminWebhooksRead],
  '/donate/groups': [Permission.EditorDonateRead],
  '/donate/permissions': [Permission.EditorDonateRead],
  '/donate/kits': [Permission.EditorDonateRead],
  '/donate/periods': [Permission.EditorDonateRead],
  '/store/products': [Permission.EditorStoreRead],
  '/store/categories': [Permission.EditorStoreRead],
  '/store/kits': [Permission.EditorStoreRead],
  '/payment': [
    Permission.EditorPaymentBonusesGiftsCreate,
    Permission.EditorPaymentBonusesUpdate,
    Permission.EditorPaymentBonusesDelete,
  ],
  '/gifts': [Permission.EditorCabinetGiftsRead],
  '/votes': [Permission.EditorVotesGiftsCreate, Permission.EditorVotesGiftsUpdate, Permission.EditorVotesGiftsDelete],
}

export function routeAccess(path: string): RouteAccess | null {
  if (ROUTE_ACCESS[path]) return ROUTE_ACCESS[path]

  const parent = Object.keys(ROUTE_ACCESS)
    .filter((route) => route !== '/' && path.startsWith(route + '/'))
    .sort((a, b) => b.length - a.length)[0]

  return parent ? ROUTE_ACCESS[parent] : null
}

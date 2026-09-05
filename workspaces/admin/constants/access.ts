import type { Permission } from 'unicore-common/permissions'
import { adminAccess } from 'unicore-api/admin'

export const SUPERUSER_ONLY = 'superuser'

export type RouteAccess = typeof SUPERUSER_ONLY | Permission[]

export const ROUTE_ACCESS: Record<string, RouteAccess> = {
  '/': ['panel.access'],
  '/users': ['panel.users.read'],
  '/revenue': ['panel.revenue.access'],
  '/roles': ['panel.roles.read'],
  '/config': ['panel.config.read'],
  '/locales': ['panel.locales.read'],
  '/api': ['panel.api.read'],
  '/modules': ['panel.extensions.read'],
  '/themes': ['panel.extensions.read'],
  '/news': ['panel.news.read', 'panel.news.create', 'panel.news.update', 'panel.news.delete', 'panel.news.delete.many'],
  '/pages': ['panel.pages.read', 'panel.pages.create', 'panel.pages.update', 'panel.pages.delete'],
  '/email': ['panel.email.read'],
  '/servers': ['panel.servers.read', 'panel.servers.create', 'panel.servers.update', 'panel.servers.delete'],
  '/mods': ['panel.mods.read.*'],
  '/webhooks': ['panel.webhooks.read'],
  '/logs': ['panel.logs.read'],
  '/donate/groups': ['panel.donate.read.*'],
  '/donate/permissions': ['panel.donate.read.*'],
  '/donate/kits': ['panel.donate.read.*'],
  '/donate/periods': ['panel.donate.read.*'],
  '/store/products': ['panel.store.read.*'],
  '/store/categories': ['panel.store.read.*'],
  '/store/kits': ['panel.store.read.*'],
  '/payment': [
    'panel.payment.bonuses.read',
    'panel.payment.bonuses.create',
    'panel.payment.bonuses.update',
    'panel.payment.bonuses.delete',
  ],
  '/gifts': ['panel.gifts.read'],
  '/votes': ['panel.votes.read', 'panel.votes.create', 'panel.votes.update', 'panel.votes.delete'],
}

export function routeAccess(path: string): RouteAccess | null {
  const routes: Record<string, RouteAccess> = { ...ROUTE_ACCESS, ...adminAccess() }

  if (routes[path]) return routes[path]

  const parent = Object.keys(routes)
    .filter((route) => route !== '/' && path.startsWith(route + '/'))
    .sort((a, b) => b.length - a.length)[0]

  return parent ? routes[parent] : null
}

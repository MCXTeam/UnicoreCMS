export const IS_PUBLIC_KEY = 'isPublic'
export const PERMISSIONS_KEY = 'permissions'
export const ALLOW_INACTIVE_KEY = 'allowInactive'

export const REGISTRY_SYMBOL = Symbol.for('unicore.api.registry.v1')

export const MODULE_ID_PATTERN = /^[a-z][a-z0-9_]{2,31}$/
export const THEME_ID_PATTERN = MODULE_ID_PATTERN

export const ACTIVE_MODULES_KEY = 'public_modules'

export const modulePrefixes = (id: string) => ({
  table: `mod_${id}_`,
  config: `mod_${id}_`,
  publicConfig: `public_mod_${id}_`,
  locale: `mod.${id}.`,
  permission: `mod.${id}.`,
  route: `mod/${id}/`,
  page: `/mod/${id}`,
})

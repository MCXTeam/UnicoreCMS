import { isDonateWebPerm } from 'unicore-common/validation'

export function donateWebPermSuggestions(perms: string[], query: string): string[] {
  const value = query.trim().toLowerCase()

  if (!value.length) return perms

  const matched = perms.filter((perm) => perm.toLowerCase().includes(value))

  return isDonateWebPerm(value) ? [value, ...matched] : matched
}

export const USER_TIMEZONE_FALLBACK = 'UTC'

export function validUserTimezone(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  } catch {
    return false
  }
}

export function browserTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return validUserTimezone(timezone) ? timezone : USER_TIMEZONE_FALLBACK
  } catch {
    return USER_TIMEZONE_FALLBACK
  }
}

interface ZonedDateFactory {
  (...args: any[]): any
  tz: (...args: any[]) => any
}

export function userDateFactory<T extends ZonedDateFactory>(factory: T, timezone: () => string): T {
  return new Proxy(factory, {
    apply(target, _thisArg, args) {
      return target.tz(...args, timezone())
    },
  })
}

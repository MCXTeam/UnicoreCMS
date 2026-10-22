import { useCookie, useNuxtApp, useState } from '#imports'
import { browserTimezone, USER_TIMEZONE_FALLBACK, validUserTimezone } from '../utils/userDate'

export function useUserTimezone() {
  const cookie = useCookie<string>('user_timezone', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  const timezone = useState<string>('user-timezone', () => validUserTimezone(cookie.value) ? cookie.value : USER_TIMEZONE_FALLBACK)

  if (import.meta.client) {
    const nuxtApp = useNuxtApp()
    const update = () => {
      timezone.value = browserTimezone()
      cookie.value = timezone.value
    }
    if (nuxtApp.isHydrating) nuxtApp.hook('app:mounted', update)
    else update()
  }

  return timezone
}

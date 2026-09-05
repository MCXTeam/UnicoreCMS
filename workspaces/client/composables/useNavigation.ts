import { clientNav } from 'unicore-api/client'
import { useConfigStore } from '~/stores/config'
import { useAuthStore } from '~/stores/auth'
import { CORE_NAVIGATION, type NavItem, type NavPlace } from '~/constants/navigation'

export const useNavigation = (place: NavPlace) => {
  const configStore = useConfigStore()
  const auth = useAuthStore()
  const config = computed(() => configStore.config)

  return computed<NavItem[]>(() =>
    [...CORE_NAVIGATION, ...((clientNav(place) || []) as unknown as NavItem[]).map((item) => ({ ...item, module: true }))]
      .filter((item) => item.places.includes(place))
      .filter((item) => {
        if (item.when === 'auth') return auth.loggedIn
        if (item.when === 'guest') return !auth.loggedIn

        return true
      })
      .filter((item) => !item.permissions?.length || item.permissions.some((permission) => auth.has(permission)))
      .map((item) => ({ ...item, href: item.configLink ? String(config.value?.[item.configLink] || '') : item.href }))
      .sort((a, b) => (a.order || 100) - (b.order || 100)),
  )
}

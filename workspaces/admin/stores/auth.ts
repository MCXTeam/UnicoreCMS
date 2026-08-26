import { defineStore } from 'pinia'
import { satisfiesPermission } from 'unicore-common/permissions'
import { SUPERUSER_ONLY, type RouteAccess } from '~/constants/access'

export interface AuthUser {
  uuid: string
  username: string
  email: string
  perms?: string[]
  roles?: any[]
  superuser?: boolean
  [key: string]: any
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    accessToken: null as string | null,
    refreshToken: null as string | null,
  }),
  getters: {
    loggedIn: (state) => !!state.user,
    isAdmin: (state) => !!state.user?.perms?.includes('panel.access') || !!state.user?.superuser,
    has:
      (state) =>
      (permission: string): boolean => {
        if (!state.user) return false
        if (state.user.superuser) return true

        return satisfiesPermission(state.user.perms || [], permission)
      },
    can(): (access: RouteAccess | null) => boolean {
      return (access: RouteAccess | null): boolean => {
        if (!this.user) return false
        if (this.user.superuser) return true
        if (!access) return true
        if (access === SUPERUSER_ONLY) return false

        return access.some((perm) => this.has(perm))
      }
    },
  },
  actions: {
    loadTokens() {
      if (import.meta.client) {
        this.accessToken = localStorage.getItem('access_token')
        this.refreshToken = localStorage.getItem('refresh_token')
      }
    },
    setTokens(access: string | null, refresh?: string | null) {
      this.accessToken = access
      if (refresh !== undefined) this.refreshToken = refresh

      if (import.meta.client) {
        if (access) localStorage.setItem('access_token', access)
        else localStorage.removeItem('access_token')

        if (refresh !== undefined) {
          if (refresh) localStorage.setItem('refresh_token', refresh)
          else localStorage.removeItem('refresh_token')
        }
      }
    },
    setUser(user: AuthUser | null) {
      this.user = user
    },
    async login(payload: Record<string, any>, config?: Record<string, any>) {
      const { $api } = useNuxtApp()
      const { data } = await $api.post('/auth/login', payload, config)
      this.setTokens(data.accessToken, data.refreshToken)
      this.setUser(data.user)
      return data
    },
    async fetchUser() {
      const { $api } = useNuxtApp()
      const { data } = await $api.get('/auth/me')
      this.setUser(data.user)
      return data.user
    },
    async refresh() {
      const { $api } = useNuxtApp()
      const { data } = await $api.post('/auth/refresh', { refresh_token: this.refreshToken })
      this.setTokens(data.accessToken, data.refreshToken)
      return data.accessToken as string
    },
    async logout() {
      const { $api } = useNuxtApp()
      const token = this.refreshToken

      this.setUser(null)
      this.setTokens(null, null)

      if (token) await $api.post('/auth/logout', { refresh_token: token }).catch(() => {})
    },
  },
})

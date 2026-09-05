import { defineStore } from 'pinia'
import { satisfiesPermission } from 'unicore-common/permissions'
import { csrfToken, setCsrfToken, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from 'unicore-common/auth'
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
    cookieAuth: false,
  }),
  getters: {
    loggedIn: (state) => !!state.user,
    hasSession: (state) => Boolean(state.refreshToken) || state.cookieAuth,
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
      if (!import.meta.client) return

      localStorage.removeItem(ACCESS_TOKEN_KEY)

      this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      this.cookieAuth = Boolean(csrfToken())
    },
    async syncCsrf() {
      if (!import.meta.client) return

      const { $api } = useNuxtApp()

      try {
        const { data } = await $api.get('/auth/csrf')

        setCsrfToken(data.token)
        this.cookieAuth = Boolean(data.present)
      } catch {}
    },
    setTokens(access: string | null, refresh?: string | null) {
      this.accessToken = access

      if (refresh === undefined) return

      this.refreshToken = this.cookieAuth ? null : refresh

      if (!import.meta.client) return

      if (this.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken)
      else localStorage.removeItem(REFRESH_TOKEN_KEY)
    },
    adopt(data: { accessToken: string; refreshToken?: string | null; user?: AuthUser }) {
      this.cookieAuth = Boolean(csrfToken())
      this.setTokens(data.accessToken, data.refreshToken ?? null)

      if (data.user) this.setUser(data.user)
    },
    setUser(user: AuthUser | null) {
      this.user = user
    },
    async login(payload: Record<string, any>, config?: Record<string, any>) {
      const { $api } = useNuxtApp()
      const { data } = await $api.post('/auth/login', payload, config)

      this.adopt(data)
      await this.syncCsrf()

      if (this.cookieAuth) this.setTokens(this.accessToken, null)

      return data
    },
    async fetchUser() {
      const { $api } = useNuxtApp()
      const { data } = await $api.get('/auth/me')

      if (data.cookieAuth && !this.cookieAuth) {
        this.cookieAuth = true
        this.setTokens(this.accessToken, null)
      }

      this.setUser(data.user)

      return data.user
    },
    async refresh() {
      const { $api } = useNuxtApp()
      const { data } = await $api.post('/auth/refresh', this.cookieAuth ? {} : { refresh_token: this.refreshToken })

      this.setTokens(data.accessToken, data.refreshToken)

      return data.accessToken as string
    },
    async logout() {
      const { $api } = useNuxtApp()
      const token = this.refreshToken
      const cookie = this.cookieAuth

      if (token || cookie) await $api.post('/auth/logout', token ? { refresh_token: token } : {}).catch(() => {})

      this.setUser(null)
      this.setTokens(null, null)
      this.cookieAuth = false
      setCsrfToken('')
    },
  },
})

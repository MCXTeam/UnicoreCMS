import type { ClientNavPlace } from 'unicore-api/client'

export type NavPlace = ClientNavPlace

export type NavVisibility = 'always' | 'auth' | 'guest'

export interface NavItem {
  key: string
  to?: string
  href?: string
  configLink?: string
  label: string
  icon?: string
  when?: NavVisibility
  places: NavPlace[]
  order?: number
  exact?: boolean
}

export const CORE_NAVIGATION: NavItem[] = [
  { key: 'home', to: '/', label: 'header.home', icon: 'bx bx-home', places: ['footer'], order: 5 },
  { key: 'servers', to: '/servers', label: 'header.servers', icon: 'bx bx-server', places: ['navbar', 'footer'], order: 10 },
  { key: 'forum', configLink: 'public_link_forum', label: 'header.forum', icon: 'bx bx-chat', places: ['navbar', 'footer'], order: 20 },
  { key: 'rules', to: '/page/rules', label: 'header.rules', icon: 'bx bx-paperclip', places: ['navbar', 'footer'], order: 30 },
  { key: 'donate', to: '/donate', label: 'header.donate', icon: 'bx bx-donate-heart', places: ['navbar', 'footer'], order: 40 },
  { key: 'start', to: '/start', label: 'header.start', icon: 'bx bx-play', places: ['footer'], order: 50 },
  { key: 'download', to: '/start', label: 'header.download', icon: 'bx bxl-windows', places: ['footer'], order: 60 },

  { key: 'cabinet', to: '/cabinet', label: 'header.cabinet', icon: 'bx bx-user', when: 'auth', places: ['cabinet'], order: 10 },
  { key: 'store', to: '/store', label: 'header.store', icon: 'bx bx-cart', when: 'auth', places: ['cabinet'], order: 20 },
  { key: 'players', to: '/players', label: 'header.players', icon: 'bx bx-stats', when: 'auth', places: ['cabinet'], order: 30 },
  { key: 'launcher', to: '/start', label: 'header.download_short', icon: 'bx bxl-windows', when: 'auth', places: ['cabinet'], order: 40 },

  { key: 'cabinet.general', to: '/cabinet', label: 'cabinet.tab_general', icon: 'bx bx-user', places: ['cabinet.tabs'], order: 10 },
  { key: 'cabinet.stats', to: '/cabinet/stats', label: 'cabinet.tab_stats', icon: 'bx bx-bar-chart-alt-2', places: ['cabinet.tabs'], order: 20 },
  { key: 'cabinet.donate', to: '/cabinet/donate', label: 'cabinet.tab_donate', icon: 'bx bx-crown', places: ['cabinet.tabs'], order: 30 },
  { key: 'cabinet.settings', to: '/cabinet/settings', label: 'cabinet.tab_settings', icon: 'bx bx-edit-alt', places: ['cabinet.tabs'], order: 40 },
  { key: 'cabinet.payment', to: '/cabinet/payment', label: 'cabinet.tab_payment', icon: 'bx bx-wallet-alt', places: ['cabinet.tabs'], order: 50 },
  { key: 'cabinet.history', to: '/cabinet/history', label: 'cabinet.tab_history', icon: 'bx bx-history', places: ['cabinet.tabs'], order: 60 },
  { key: 'cabinet.auth', to: '/cabinet/auth', label: 'cabinet.tab_auth', icon: 'bx bx-bug', places: ['cabinet.tabs'], order: 70 },
  { key: 'cabinet.referals', to: '/cabinet/referals', label: 'cabinet.tab_referals', icon: 'bx bxs-megaphone', places: ['cabinet.tabs'], order: 80 },
  { key: 'cabinet.gifts', to: '/cabinet/gifts', label: 'cabinet.tab_gifts', icon: 'bx bx-party', places: ['cabinet.tabs'], order: 90 },

  { key: 'store.products', to: '/store/products', label: 'store.tab_products', icon: 'bx bx-store', places: ['store.tabs'], order: 10, exact: false },
  { key: 'store.cart', to: '/store/cart', label: 'store.tab_cart', icon: 'bx bx-cart-alt', places: ['store.tabs'], order: 20, exact: false },
  { key: 'store.warehouse', to: '/store/warehouse', label: 'store.tab_warehouse', icon: 'bx bx-package', places: ['store.tabs'], order: 30, exact: false },

  { key: 'players.votes', to: '/players/votes', label: 'players.tab_votes', icon: 'bx bx-party', places: ['players.tabs'], order: 10, exact: false },
  { key: 'players.playtime', to: '/players/playtime', label: 'players.tab_playtime', icon: 'bx bx-game', places: ['players.tabs'], order: 20, exact: false },
  { key: 'players.banlist', to: '/players/banlist', label: 'players.tab_banlist', icon: 'bx bxs-shield-alt-2', places: ['players.tabs'], order: 30, exact: false },
]

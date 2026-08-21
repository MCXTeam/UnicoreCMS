export type NavPlace = 'navbar' | 'cabinet' | 'footer'

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
}

export const CORE_NAVIGATION: NavItem[] = [
  { key: 'servers', to: '/servers', label: 'header.servers', icon: 'bx bx-server', places: ['navbar', 'footer'], order: 10 },
  { key: 'forum', configLink: 'public_link_forum', label: 'header.forum', icon: 'bx bx-chat', places: ['navbar', 'footer'], order: 20 },
  { key: 'rules', to: '/page/rules', label: 'header.rules', icon: 'bx bx-paperclip', places: ['navbar', 'footer'], order: 30 },
  { key: 'donate', to: '/donate', label: 'header.donate', icon: 'bx bx-donate-heart', places: ['navbar', 'footer'], order: 40 },
  { key: 'cabinet', to: '/cabinet', label: 'header.cabinet', icon: 'bx bx-user', when: 'auth', places: ['cabinet'], order: 10 },
  { key: 'store', to: '/store', label: 'header.store', icon: 'bx bx-cart', when: 'auth', places: ['cabinet'], order: 20 },
  { key: 'players', to: '/players', label: 'header.players', icon: 'bx bx-group', when: 'auth', places: ['cabinet'], order: 30 },
]

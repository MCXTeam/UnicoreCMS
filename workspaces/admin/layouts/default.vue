<template>
  <div :class="containerClass" @click="onWrapperClick">
    <AppTopbar @menu-toggle="onMenuToggle" />
    <div class="layout-sidebar" @click="onSidebarClick">
      <AppMenu :model="menu" @menuitem-click="onMenuItemClick" />
    </div>
    <div class="layout-main-container">
      <div class="layout-main">
        <slot />
      </div>
      <AppFooter />
    </div>
    <transition name="layout-mask">
      <div class="layout-mask p-component-overlay" v-if="mobileMenuActive"></div>
    </transition>
  </div>
</template>

<script>
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '~/stores/auth'
import { routeAccess } from '~/constants/access'
import { usePrimeVue } from 'primevue/config'

export default {
  setup() {
    const toast = useToast()
    const primevue = usePrimeVue()
    return { toast, primevue }
  },
  data() {
    return {
      layoutMode: 'static',
      staticMenuInactive: false,
      overlayMenuActive: false,
      mobileMenuActive: false,
      menuClick: false,
      menuSource: [
        {
          label: 'admin.menu_main',
          items: [
            {
              label: 'admin.menu_dashboard',
              icon: 'pi pi-fw pi-chart-bar',
              to: '/',
            },
            {
              label: 'admin.menu_users',
              icon: 'pi pi-fw pi-users',
              to: '/users',
            },
            {
              label: 'admin.menu_roles',
              icon: 'pi pi-fw pi-lock',
              to: '/roles',
            },
            {
              label: 'admin.menu_revenue',
              icon: 'pi pi-fw pi-wallet',
              to: '/revenue',
            },
            {
              label: 'admin.menu_settings',
              icon: 'pi pi-fw pi-bars',
              to: '/config',
            },
          ],
        },
        {
          label: 'admin.menu_content',
          items: [
            {
              label: 'admin.menu_news',
              icon: 'pi pi-paperclip',
              to: '/news',
            },
            {
              label: 'admin.menu_pages',
              icon: 'pi pi-sitemap',
              to: '/pages',
            },
            {
              label: 'admin.menu_email',
              icon: 'pi pi-send',
              to: '/email',
            },
            {
              label: 'admin.menu_servers',
              icon: 'pi pi-play',
              to: '/servers',
            },
            {
              label: 'admin.menu_mods',
              icon: 'pi pi-map-marker',
              to: '/mods',
            },
            {
              label: 'admin.menu_locales',
              icon: 'pi pi-globe',
              to: '/locales',
            },
          ],
        },
        {
          label: 'E-Commerce',
          items: [
            {
              label: 'admin.menu_donate',
              icon: 'pi pi-fw pi-money-bill',
              items: [
                {
                  label: 'admin.menu_donate_groups',
                  icon: 'pi pi-fw pi-users',
                  to: '/donate/groups',
                },
                {
                  label: 'admin.menu_donate_permissions',
                  icon: 'pi pi-fw pi-money-bill',
                  to: '/donate/permissions',
                },
                {
                  label: 'admin.menu_donate_kits',
                  icon: 'pi pi-fw pi-briefcase',
                  to: '/donate/kits',
                },
                {
                  label: 'admin.menu_periods',
                  icon: 'pi pi-fw pi-calendar',
                  to: '/donate/periods',
                },
              ],
            },
            {
              label: 'admin.menu_store',
              icon: 'pi pi-fw pi-shopping-cart',
              items: [
                {
                  label: 'admin.menu_catalog',
                  icon: 'pi pi-fw pi-shopping-cart',
                  to: '/store/products',
                },
                {
                  label: 'admin.menu_categories',
                  icon: 'pi pi-fw pi-list',
                  to: '/store/categories',
                },
                {
                  label: 'admin.menu_kits',
                  icon: 'pi pi-fw pi-briefcase',
                  to: '/store/kits',
                },
              ],
            },
            {
              label: 'admin.menu_payment',
              icon: 'pi pi-fw pi-wallet',
              to: '/payment',
            },
            {
              label: 'admin.menu_gifts',
              icon: 'pi pi-fw pi-dollar',
              to: '/gifts',
            },
            {
              label: 'admin.menu_votes',
              icon: 'pi pi-fw pi-volume-off',
              to: '/votes',
            },
          ],
        },
        {
          label: 'admin.menu_utils',
          items: [
            {
              label: 'admin.menu_api',
              icon: 'pi pi-fw pi-reply',
              to: '/api',
            },
            {
              label: 'admin.menu_webhooks',
              icon: 'pi pi-fw pi-link',
              to: '/webhooks',
            },
          ],
        },
      ],
    }
  },
  watch: {
    $route() {
      this.toast.removeAllGroups()
    },
  },
  methods: {
    onWrapperClick() {
      if (!this.menuClick) {
        this.overlayMenuActive = false
        this.mobileMenuActive = false
      }
      this.menuClick = false
    },
    onMenuToggle(event) {
      this.menuClick = true
      if (this.isDesktop()) {
        if (this.layoutMode === 'overlay') {
          if (this.mobileMenuActive === true) {
            this.overlayMenuActive = true
          }
          this.overlayMenuActive = !this.overlayMenuActive
          this.mobileMenuActive = false
        } else if (this.layoutMode === 'static') {
          this.staticMenuInactive = !this.staticMenuInactive
        }
      } else {
        this.mobileMenuActive = !this.mobileMenuActive
      }
      event?.preventDefault()
    },
    onSidebarClick() {
      this.menuClick = true
    },
    onMenuItemClick(event) {
      if (event.item && !event.item.items) {
        this.overlayMenuActive = false
        this.mobileMenuActive = false
      }
    },
    onLayoutChange(layoutMode) {
      this.layoutMode = layoutMode
    },
    addClass(element, className) {
      if (element.classList) element.classList.add(className)
      else element.className += ' ' + className
    },
    removeClass(element, className) {
      if (element.classList) element.classList.remove(className)
      else element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ')
    },
    isDesktop() {
      return window.innerWidth >= 992
    },
    isSidebarVisible() {
      if (this.isDesktop()) {
        if (this.layoutMode === 'static') return !this.staticMenuInactive
        else if (this.layoutMode === 'overlay') return this.overlayMenuActive
      }
      return true
    },
  },
  computed: {
    menu() {
      const auth = useAuthStore()

      const allowed = (item) => {
        if (item.items) {
          const items = item.items.map(allowed).filter(Boolean)
          return items.length ? { ...item, items } : null
        }

        return auth.can(routeAccess(item.to)) ? item : null
      }

      return this.menuSource.map(allowed).filter(Boolean)
    },

    containerClass() {
      return [
        'layout-wrapper',
        {
          'layout-overlay': this.layoutMode === 'overlay',
          'layout-static': this.layoutMode === 'static',
          'layout-static-sidebar-inactive': this.staticMenuInactive && this.layoutMode === 'static',
          'layout-overlay-sidebar-active': this.overlayMenuActive && this.layoutMode === 'overlay',
          'layout-mobile-sidebar-active': this.mobileMenuActive,
          'p-input-filled': this.primevue.config.inputStyle === 'filled',
          'p-ripple-disabled': this.primevue.config.ripple === false,
        },
      ]
    },
  },
  beforeUpdate() {
    if (this.mobileMenuActive) this.addClass(document.body, 'body-overflow-hidden')
    else this.removeClass(document.body, 'body-overflow-hidden')
  },
}
</script>

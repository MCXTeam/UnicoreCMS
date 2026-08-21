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
import { CORE_MENU } from '~/constants/menu'
import { adminMenu } from 'unicore-api/admin'
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
    menuSource() {
      const items = adminMenu()

      return items.length ? [...CORE_MENU, { label: 'admin.menu_extensions', items }] : CORE_MENU
    },

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

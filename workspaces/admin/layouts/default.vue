<template>
  <div :class="containerClass" @click="onWrapperClick">
    <Toast />
    <ConfirmDialog />
    <AppTopbar @menu-toggle="onMenuToggle" />
    <div class="layout-sidebar" @click="onSidebarClick">
      <AppMenu :model="menu" @menuitem-click="onMenuItemClick" />
    </div>
    <div class="layout-main-container">
      <div class="layout-main">
        <Nuxt />
      </div>
      <AppFooter />
    </div>
    <transition name="layout-mask">
      <div class="layout-mask p-component-overlay" v-if="mobileMenuActive"></div>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      layoutMode: 'static',
      staticMenuInactive: false,
      overlayMenuActive: false,
      mobileMenuActive: false,
      menu: [
        {
          label: 'Основное',
          items: [
            {
              label: 'Панель управления',
              icon: 'pi pi-fw pi-chart-bar',
              to: '/',
            },
            {
              label: 'Пользователи',
              icon: 'pi pi-fw pi-users',
              to: '/users',
            },
            {
              label: 'Роли',
              icon: 'pi pi-fw pi-lock',
              to: '/roles',
            },
            {
              label: 'Настройки',
              icon: 'pi pi-fw pi-bars',
              to: '/config',
            },
          ],
        },
        {
          label: 'Управление контентом',
          items: [
            {
              label: 'Новости',
              icon: 'pi pi-paperclip',
              to: '/news',
            },
            {
              label: 'Статические страницы',
              icon: 'pi pi-sitemap',
              to: '/pages',
            },
            {
              label: 'Email-сообщения',
              icon: 'pi pi-send',
              to: '/email',
            },
            {
              label: 'Серверы',
              icon: 'pi pi-play',
              to: '/servers',
            },
            {
              label: 'Моды',
              icon: 'pi pi-map-marker',
              to: '/mods',
            },
          ],
        },
        {
          label: 'E-Commerce',
          items: [
            {
              label: 'Донат',
              icon: 'pi pi-fw pi-money-bill',
              items: [
                {
                  label: 'Донат-группы',
                  icon: 'pi pi-fw pi-users',
                  to: '/donate/groups',
                },
                {
                  label: 'Донат-права',
                  icon: 'pi pi-fw pi-money-bill',
                  to: '/donate/permissions',
                },
                {
                  label: 'Донат-киты',
                  icon: 'pi pi-fw pi-briefcase',
                  to: '/donate/kits',
                },
                {
                  label: 'Периоды',
                  icon: 'pi pi-fw pi-calendar',
                  to: '/donate/periods',
                },
              ],
            },
            {
              label: 'Магазин',
              icon: 'pi pi-fw pi-shopping-cart',
              items: [
                {
                  label: 'Каталог',
                  icon: 'pi pi-fw pi-shopping-cart',
                  to: '/store/products',
                },
                {
                  label: 'Категории',
                  icon: 'pi pi-fw pi-list',
                  to: '/store/categories',
                },
                {
                  label: 'Киты',
                  icon: 'pi pi-fw pi-briefcase',
                  to: '/store/kits',
                },
              ],
            },
            {
              label: 'Пополнение',
              icon: 'pi pi-fw pi-wallet',
              items: [
                {
                  label: 'Бонусы',
                  icon: 'pi pi-fw pi-dollar',
                  to: '/payment/bonuses',
                }
              ],
            },
            {
              label: 'Промо-коды',
              icon: 'pi pi-fw pi-dollar',
              to: '/gifts',
            },
            {
              label: 'Голосование',
              icon: 'pi pi-fw pi-volume-off',
              to: '/icons',
            },
          ],
        },
        {
          label: 'Утилиты',
          items: [
            // {
            //   label: 'Управление хранилищем',
            //   icon: 'pi pi-fw pi-folder',
            //   to: '/',
            // },
            // {
            //   label: 'Слияние базы данных',
            //   icon: 'pi pi-fw pi-clone',
            //   to: '/users',
            // },
            {
              label: 'API-Ключи',
              icon: 'pi pi-fw pi-reply',
              to: '/api',
            },
            {
              label: 'Вебхуки',
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
      this.menuActive = false
      this.$toast.removeAllGroups()
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
    onMenuToggle() {
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
      event.preventDefault()
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
    containerClass() {
      return [
        'layout-wrapper',
        {
          'layout-overlay': this.layoutMode === 'overlay',
          'layout-static': this.layoutMode === 'static',
          'layout-static-sidebar-inactive': this.staticMenuInactive && this.layoutMode === 'static',
          'layout-overlay-sidebar-active': this.overlayMenuActive && this.layoutMode === 'overlay',
          'layout-mobile-sidebar-active': this.mobileMenuActive,
          'p-input-filled': this.$primevue.config.inputStyle === 'filled',
          'p-ripple-disabled': this.$primevue.config.ripple === false,
        },
      ]
    },
  },
  mounted() {
    this.socket = this.$nuxtSocket({})
  },
  beforeUpdate() {
    if (this.mobileMenuActive) this.addClass(document.body, 'body-overflow-hidden')
    else this.removeClass(document.body, 'body-overflow-hidden')
  },
}
</script>

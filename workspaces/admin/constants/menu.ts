export const CORE_MENU = [
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
      {
        label: 'admin.menu_modules',
        icon: 'pi pi-fw pi-box',
        to: '/modules',
      },
      {
        label: 'admin.menu_themes',
        icon: 'pi pi-fw pi-palette',
        to: '/themes',
      },
    ],
  },
]

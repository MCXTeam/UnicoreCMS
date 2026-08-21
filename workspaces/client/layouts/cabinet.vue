<template>
  <div>
    <nav class="vs-navbar cabinet-navbar d-flex align-items-center justify-content-between py-2">
      <div class="d-flex align-items-center">
        <Button @click="activeSidebar = true" class="d-lg-none d-md-block me-4" text>
          <i class="bx bx-menu"></i>
        </Button>
        <NuxtLink to="/" class="d-flex align-items-center without-underline">
          <img class="my-1" src="/icon.png" height="64px" />
          <h2 class="ms-3 my-0 d-none d-md-block">{{ $pub.sitename }}</h2>
        </NuxtLink>
        <NuxtLink v-for="item in navbar" :key="item.key" :to="item.to" class="vs-navbar__item d-none d-lg-block ms-lg-2">
          <i :class="item.icon"></i> {{ $t(item.label) }}
        </NuxtLink>
      </div>
      <div class="d-flex align-items-center p-2">
        <Avatar class="rounded shadow">
          <SkinView2D class="rounded" :width="32" :height="32" :skin="$auth.user?.skin" />
        </Avatar>
        <div class="ms-3">
          <h4 class="d-block d-lg-none m-0">{{ $auth.user?.username }}</h4>
          <h4 class="d-none d-lg-block m-0">{{ $t('panel.hello', { username: $auth.user?.username || '' }) }}</h4>
          <h5 class="m-0">{{ $t('panel.balance', { amount: $utils.formatCurrency('real', $auth.user?.real) }) }}</h5>
        </div>
        <Button @click="$unicore.logout()" text severity="danger" size="large" class="ms-2 d-none d-lg-block">
          <i class="bx bx-exit"></i>
        </Button>
        <div class="d-none d-lg-block" style="font-size: 1.5rem">
          <i v-if="$colorMode.preference == 'light'" @click="$unicore.switchTheme()" class="bx bxs-sun" style="cursor: pointer"></i>
          <i v-else @click="$unicore.switchTheme()" class="bx bxs-moon" style="cursor: pointer"></i>
        </div>
      </div>
    </nav>

    <Drawer v-model:visible="activeSidebar" class="vs-sidebar">
      <template #header>
        <img src="/icon.png" height="48px" />
        <h2 class="ms-2 my-0">{{ $pub.sitename }}</h2>
      </template>
      <div class="d-flex flex-column h-100">
        <NuxtLink to="/"
          ><span class="vs-sidebar__item exact"><i class="bx bx-home"></i> {{ $t('header.home') }}</span></NuxtLink
        >
        <NuxtLink v-for="item in navbar" :key="item.key" :to="item.to"
          ><span class="vs-sidebar__item"><i :class="item.icon"></i> {{ $t(item.label) }}</span></NuxtLink
        >
        <div class="mt-auto d-flex align-items-center justify-content-between">
          <Avatar>
            <SkinView2D class="rounded" :width="48" :height="48" :skin="$auth.user?.skin" />
          </Avatar>
          <div class="d-flex flex-column justify-content-center">
            <h4 class="m-0">{{ $auth.user?.username }}</h4>
            <h5 class="m-0">{{ $t('panel.balance', { amount: $utils.formatCurrency('real', $auth.user?.real) }) }}</h5>
          </div>
          <Avatar style="cursor: pointer" @click="$unicore.logout()">
            <i class="bx bx-power-off"></i>
          </Avatar>
        </div>
      </div>
    </Drawer>

    <div class="container cabinet-container unicore-content">
      <h1 class="py-3">{{ $t(name) }}</h1>
      <div class="row">
        <div class="col">
          <div class="panel cabinet-tab-panel mb-4" v-if="tabs.length">
            <NuxtLink v-for="tab in tabs" :key="tab.key" :to="tab.to" :class="tabClass(tab)">
              <i :class="tab.icon"></i> {{ $t(tab.label) }}
            </NuxtLink>
          </div>
          <component v-if="storeSidebarComponent" :is="storeSidebarComponent" v-bind="storeSidebar?.payload" />
        </div>
        <div class="col-xl-9 pe-xl-5">
          <div class="panel px-0 py-4">
            <slot />
          </div>
        </div>
      </div>
    </div>
    <Footer style="margin-top: 120px" />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import CartSidebar from '~/components/CartSidebar.vue'
import StoreProductsSidebar from '~/components/StoreProductsSidebar.vue'
import WarehouseSidebar from '~/components/WarehouseSidebar.vue'
import { useUiStore, type StoreSidebarName } from '~/stores/ui'
import type { NavItem } from '~/constants/navigation'

const storeSidebars: Record<StoreSidebarName, Component> = {
  CartSidebar,
  StoreProductsSidebar,
  WarehouseSidebar,
}

const route = useRoute()
const ui = useUiStore()
const { $t } = useNuxtApp()

const navbar = useNavigation('cabinet')
const cabinetTabs = useNavigation('cabinet.tabs')
const storeTabs = useNavigation('store.tabs')
const playersTabs = useNavigation('players.tabs')

const tabs = computed(() => {
  if (route.path.startsWith('/store')) return storeTabs.value
  if (route.path.startsWith('/players')) return playersTabs.value

  return cabinetTabs.value
})

function tabClass(tab: NavItem) {
  if (tab.exact !== false) return ''

  return ['no-exact', route.path.startsWith(String(tab.to)) ? 'nuxt-link-active' : '']
}

const activeSidebar = ref(false)
const name = computed(() => String(route.meta.title || ''))
const storeSidebar = computed(() => ui.storeSidebar)
const storeSidebarComponent = computed(() => (storeSidebar.value ? storeSidebars[storeSidebar.value.component] : null))

useHead({ title: computed(() => $t('header.cabinet')) })

watch(
  () => route.fullPath,
  () => {
    nextTick(() => {
      activeSidebar.value = false
    })
  },
)
</script>

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
        <NuxtLink to="/cabinet" class="vs-navbar__item d-none d-lg-block ms-4">
          <i class="bx bx-user"></i> {{ $t('header.cabinet') }}
        </NuxtLink>
        <NuxtLink to="/store" class="vs-navbar__item d-none d-lg-block"> <i class="bx bx-cart"></i> {{ $t('header.store') }} </NuxtLink>
        <NuxtLink to="/players" class="vs-navbar__item d-none d-lg-block">
          <i class="bx bx-stats"></i> {{ $t('header.players') }}
        </NuxtLink>
        <NuxtLink to="/start" class="vs-navbar__item d-none d-lg-block">
          <i class="bx bxl-windows"></i> {{ $t('header.download_short') }}
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
        <NuxtLink to="/cabinet"
          ><span class="vs-sidebar__item"><i class="bx bx-user"></i> {{ $t('header.cabinet') }}</span></NuxtLink
        >
        <NuxtLink to="/store"
          ><span class="vs-sidebar__item"><i class="bx bx-cart"></i> {{ $t('header.store') }}</span></NuxtLink
        >
        <NuxtLink to="/players"
          ><span class="vs-sidebar__item"><i class="bx bx-stats"></i> {{ $t('header.players') }}</span></NuxtLink
        >
        <NuxtLink to="/start"
          ><span class="vs-sidebar__item"><i class="bx bxl-windows"></i> {{ $t('header.download_short') }}</span></NuxtLink
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
          <div class="panel cabinet-tab-panel mb-4" v-if="$route.path.startsWith('/cabinet')">
            <NuxtLink to="/cabinet"> <i class="bx bx-user"></i> {{ $t('cabinet.tab_general') }} </NuxtLink>
            <NuxtLink to="/cabinet/stats"> <i class="bx bx-bar-chart-alt-2"></i> {{ $t('cabinet.tab_stats') }} </NuxtLink>
            <NuxtLink to="/cabinet/donate"> <i class="bx bx-crown"></i> {{ $t('cabinet.tab_donate') }} </NuxtLink>
            <NuxtLink to="/cabinet/settings"> <i class="bx bx-edit-alt"></i> {{ $t('cabinet.tab_settings') }} </NuxtLink>
            <NuxtLink to="/cabinet/payment"> <i class="bx bx-wallet-alt"></i> {{ $t('cabinet.tab_payment') }} </NuxtLink>
            <NuxtLink to="/cabinet/history"> <i class="bx bx-history"></i> {{ $t('cabinet.tab_history') }} </NuxtLink>
            <NuxtLink to="/cabinet/auth"> <i class="bx bx-bug"></i> {{ $t('cabinet.tab_auth') }} </NuxtLink>
            <NuxtLink to="/cabinet/referals"> <i class="bx bxs-megaphone"></i> {{ $t('cabinet.tab_referals') }} </NuxtLink>
            <NuxtLink to="/cabinet/gifts"> <i class="bx bx-party"></i> {{ $t('cabinet.tab_gifts') }} </NuxtLink>
          </div>
          <div v-else-if="$route.path.startsWith('/store')">
            <div class="panel cabinet-tab-panel mb-4">
              <NuxtLink class="no-exact" to="/store/products"> <i class="bx bx-store"></i> {{ $t('store.tab_products') }} </NuxtLink>
              <NuxtLink class="no-exact" to="/store/cart"> <i class="bx bx-cart-alt"></i> {{ $t('store.tab_cart') }} </NuxtLink>
              <NuxtLink class="no-exact" to="/store/warehouse"> <i class="bx bx-package"></i> {{ $t('store.tab_warehouse') }} </NuxtLink>
            </div>
          </div>
          <div v-else-if="$route.path.startsWith('/players')">
            <div class="panel cabinet-tab-panel mb-4">
              <NuxtLink class="no-exact" to="/players/votes"> <i class="bx bx-party"></i> {{ $t('players.tab_votes') }} </NuxtLink>
              <NuxtLink class="no-exact" to="/players/playtime"> <i class="bx bx-game"></i> {{ $t('players.tab_playtime') }} </NuxtLink>
              <NuxtLink class="no-exact" to="/players/banlist">
                <i class="bx bxs-shield-alt-2"></i> {{ $t('players.tab_banlist') }}
              </NuxtLink>
            </div>
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

const storeSidebars: Record<StoreSidebarName, Component> = {
  CartSidebar,
  StoreProductsSidebar,
  WarehouseSidebar,
}

const route = useRoute()
const ui = useUiStore()
const { $t } = useNuxtApp()

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

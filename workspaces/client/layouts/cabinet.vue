<template>
  <div class="cab">
    <header class="cab-top">
      <div class="cab-top__inner">
        <Button class="cab-burger d-xl-none" text @click="activeSidebar = true">
          <i class="bx bx-menu"></i>
        </Button>
        <NuxtLink to="/" class="cab-brand without-underline">
          <img src="/icon.png" height="34" />
          <span class="d-none d-md-inline">{{ $pub.sitename }}</span>
        </NuxtLink>
        <nav class="cab-top__nav d-none d-xl-flex">
          <NuxtLink v-for="item in navbar" :key="item.key" :to="item.to" class="cab-top__link without-underline">
            <i :class="item.icon"></i> {{ $t(item.label) }}
          </NuxtLink>
        </nav>
        <div class="cab-top__side">
          <NuxtLink to="/cabinet/payment" class="cab-wallet without-underline">
            <i class="bx bx-wallet-alt"></i>
            <span>{{ $utils.formatCurrency('real', $auth.user?.real) }}</span>
          </NuxtLink>
          <Button text class="cab-icon-btn" @click="$unicore.switchTheme()">
            <i v-if="$colorMode.preference == 'light'" class="bx bxs-sun"></i>
            <i v-else class="bx bxs-moon"></i>
          </Button>
          <Button text severity="danger" class="cab-icon-btn" @click="$unicore.logout()">
            <i class="bx bx-exit"></i>
          </Button>
        </div>
      </div>
    </header>

    <Drawer v-model:visible="activeSidebar" class="vs-sidebar">
      <template #header>
        <img src="/icon.png" height="40" />
        <h3 class="ms-2 my-0">{{ $pub.sitename }}</h3>
      </template>
      <nav class="cab-menu">
        <NuxtLink v-for="item in navbar" :key="item.key" :to="item.to" class="cab-menu__item without-underline">
          <i :class="item.icon"></i> {{ $t(item.label) }}
        </NuxtLink>
      </nav>
      <hr />
      <nav class="cab-menu">
        <NuxtLink v-for="tab in tabs" :key="tab.key" :to="tab.to" :class="['cab-menu__item', 'without-underline', tabClass(tab)]">
          <i :class="tab.icon"></i> {{ $t(tab.label) }}
        </NuxtLink>
      </nav>
    </Drawer>

    <div class="cab-shell">
      <aside class="cab-aside">
        <div class="cab-aside__sticky">
          <div class="cab-aside__desktop">
            <div class="cab-card cab-me">
              <SkinView2D class="cab-me__face" :width="52" :height="52" :skin="$auth.user?.skin" />
              <div class="cab-me__text">
                <h4 class="m-0" v-text="$auth.user?.username" />
                <span>{{ $utils.formatCurrency('virtual', $auth.user?.virtual) }} {{ $t('cabinet.bonuses').toLowerCase() }}</span>
              </div>
            </div>
            <nav class="cab-menu cab-menu--rail">
              <NuxtLink v-for="tab in tabs" :key="tab.key" :to="tab.to" :class="['cab-menu__item', 'without-underline', tabClass(tab)]">
                <i :class="tab.icon"></i> {{ $t(tab.label) }}
              </NuxtLink>
            </nav>
          </div>
          <div v-if="storeSidebarComponent" class="cab-card cab-store-side">
            <component :is="storeSidebarComponent" v-bind="storeSidebar?.payload" />
          </div>
        </div>
      </aside>

      <main class="cab-main">
        <div class="cab-head">
          <h1 class="m-0">{{ $t(name) }}</h1>
          <p v-if="hint" class="m-0">{{ $t(hint) }}</p>
        </div>
        <div class="cab-tabs d-xl-none">
          <NuxtLink v-for="tab in tabs" :key="tab.key" :to="tab.to" :class="['cab-tabs__item', 'without-underline', tabClass(tab)]">
            <i :class="tab.icon"></i> {{ $t(tab.label) }}
          </NuxtLink>
        </div>
        <slot />
      </main>
    </div>

    <Footer style="margin-top: 100px" />
    <GiftCodeDialog />
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
const hint = computed(() => String(route.meta.hint || ''))
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

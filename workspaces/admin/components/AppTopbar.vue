<template>
  <div class="layout-topbar">
    <NuxtLink to="/" class="layout-topbar-logo">
      <img alt="Logo" src="/logo.png" />
      <span>UNICORECMS</span>
    </NuxtLink>
    <button class="p-link layout-menu-button layout-topbar-button" @click="onMenuToggle">
      <i class="pi pi-bars"></i>
    </button>

    <button
      class="p-link layout-topbar-menu-button layout-topbar-button"
      v-styleclass="{
        selector: '@next',
        enterClass: 'hidden',
        enterActiveClass: 'scalein',
        leaveToClass: 'hidden',
        leaveActiveClass: 'fadeout',
        hideOnOutsideClick: true,
      }"
    >
      <i class="pi pi-ellipsis-v"></i>
    </button>
    <ul class="layout-topbar-menu hidden lg:flex origin-top">
      <li v-if="locales.length > 1" class="flex align-items-center">
        <Select
          class="topbar-locale"
          :modelValue="locale"
          @update:modelValue="$setLocale"
          :options="locales"
          optionLabel="name"
          optionValue="code"
        />
      </li>
      <li>
        <button class="p-link layout-topbar-button" @click="toggleTheme">
          <i :class="colorMode.value === 'dark' ? 'pi pi-sun' : 'pi pi-moon'"></i>
          <span>{{ $t('admin.theme') }}</span>
        </button>
      </li>
      <li>
        <NuxtLink class="p-link layout-topbar-button" :to="'/users/' + authStore.user?.uuid">
          <i class="pi pi-user"></i>
          <span>{{ $t('admin.profile') }}</span>
        </NuxtLink>
      </li>
      <li>
        <button class="p-link layout-topbar-button" @click="logout">
          <i class="pi pi-sign-out"></i>
          <span>{{ $t('admin.logout') }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
import { useAuthStore } from '~/stores/auth'
import { useLocale, useLocales } from '~/composables/useLocale'

export default {
  emits: ['menu-toggle', 'topbar-menu-toggle'],
  setup() {
    const authStore = useAuthStore()
    const colorMode = useColorMode()

    return { authStore, colorMode, locales: useLocales(), locale: useLocale() }
  },
  methods: {
    toggleTheme() {
      this.colorMode.preference = this.colorMode.value === 'dark' ? 'light' : 'dark'
    },
    onMenuToggle(event) {
      this.$emit('menu-toggle', event)
    },
    onTopbarMenuToggle(event) {
      this.$emit('topbar-menu-toggle', event)
    },
    async logout() {
      await this.authStore.logout()
      navigateTo('/login')
    },
    topbarImage() {
      return '/images/logo-white.svg'
    },
  },
}
</script>

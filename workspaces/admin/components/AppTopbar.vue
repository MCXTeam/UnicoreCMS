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
      <li>
        <NuxtLink class="p-link layout-topbar-button" :to="'/users/' + authStore.user?.uuid">
          <i class="pi pi-user"></i>
          <span>Профиль</span>
        </NuxtLink>
      </li>
      <li>
        <button class="p-link layout-topbar-button" @click="logout">
          <i class="pi pi-sign-out"></i>
          <span>Выйти</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
import { useAuthStore } from '~/stores/auth'

export default {
  emits: ['menu-toggle', 'topbar-menu-toggle'],
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
  methods: {
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

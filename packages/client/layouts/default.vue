<template>
  <div>
    <vs-navbar
      not-line
      square
      target-scroll="#padding-scroll-content"
      padding-scroll
      center-collapsed
      v-model="active"
    >
      <template #left>
        <vs-button
          class="d-lg-none d-md-block me-4"
          @click="activeSidebar = !activeSidebar"
          flat
          icon
        >
          <i class="bx bx-menu"></i>
        </vs-button>
        <img class="my-2" src="/icon.png" height="64px" />
        <h2 class="ms-3 my-0 d-none d-md-block">UnicoreCMS</h2>
      </template>
      <vs-navbar-item
        class="d-none d-lg-block"
        :active="active == 'servers'"
        id="guide"
      >
        <i class="bx bx-server"></i> Серверы
      </vs-navbar-item>
      <vs-navbar-item class="d-none d-lg-block" id="docs">
        <i class="bx bx-chat"></i> Форум
      </vs-navbar-item>
      <vs-navbar-item
        class="d-none d-lg-block"
        :active="active == 'donate'"
        id="components"
      >
        <i class="bx bx-paperclip"></i> Правила
      </vs-navbar-item>
      <vs-navbar-item
        class="d-none d-lg-block"
        :active="active == 'rules'"
        id="components"
      >
        <i class="bx bx-donate-heart"></i> Донат
      </vs-navbar-item>
      <template #right>
        <vs-switch dark :val="color_mode" v-model="$colorMode.value">
          <template #circle>
            <i v-if="$colorMode.value === 'light'" class="bx bxs-moon"></i>
            <i v-else class="bx bxs-sun"></i>
          </template>
        </vs-switch>
        <vs-button size="xl">Начать игру <i class="bx bx-play"></i></vs-button>
      </template>
    </vs-navbar>
    <Sidebar />
    <div id="padding-scroll-content" class="square">
      <nuxt-child />
      <div class="child">child 1</div>
      <div class="child">child 2</div>
      <div class="child">child 3</div>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    active: '',
  }),
  watch: {
    '$colorMode.value': function (val) {
      this.$colorMode.value === 'dark' ? this.$colorMode.preference = 'light' : this.$colorMode.preference = 'dark'
    }
  },
}
</script>

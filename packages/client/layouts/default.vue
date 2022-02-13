<template>
  <div>
    <vs-navbar v-model="active" not-line square target-scroll="#padding-scroll-content" padding-scroll center-collapsed>
      <template #left>
        <vs-button class="d-lg-none d-md-block me-4" flat icon @click="activeSidebar = !activeSidebar">
          <i class="bx bx-menu"></i>
        </vs-button>
        <img class="my-2" src="/icon.png" height="64px" />
        <h2 class="ms-3 my-0 d-none d-md-block">UnicoreCMS</h2>
      </template>
      <vs-navbar-item id="guide" class="d-none d-lg-block" :active="active == 'servers'">
        <i class="bx bx-server"></i> Серверы
      </vs-navbar-item>
      <vs-navbar-item id="docs" class="d-none d-lg-block"> <i class="bx bx-chat"></i> Форум </vs-navbar-item>
      <vs-navbar-item id="components" class="d-none d-lg-block" :active="active == 'donate'">
        <i class="bx bx-paperclip"></i> Правила
      </vs-navbar-item>
      <vs-navbar-item id="components" class="d-none d-lg-block" :active="active == 'rules'">
        <i class="bx bx-donate-heart"></i> Донат
      </vs-navbar-item>
      <template #right>
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
}
</script>

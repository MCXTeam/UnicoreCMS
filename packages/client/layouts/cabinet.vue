<template>
  <div>
    <vs-navbar class="cabinet-navbar" not-line square center-collapsed>
      <template #left>
        <vs-button class="d-lg-none d-md-block me-4" flat icon>
          <i class="bx bx-menu"></i>
        </vs-button>
        <nuxt-link to="/" class="d-flex align-items-center without-underline">
          <img class="my-1" src="/icon.png" height="64px" />
          <h2 class="ms-3 my-0 d-none d-md-block" v-text="$config.name" />
        </nuxt-link>
        <nuxt-link to="/cabinet" class="vs-navbar__item d-none d-lg-block ms-4"> <i class="bx bx-user"></i> Личный кабинет </nuxt-link>
        <nuxt-link to="/cabinet/store" class="vs-navbar__item d-none d-lg-block"> <i class="bx bx-cart"></i> Магазин </nuxt-link>
        <nuxt-link to="/cabinet/players" class="vs-navbar__item d-none d-lg-block"> <i class="bx bx-stats"></i> Игроки </nuxt-link>
        <nuxt-link to="/download" class="vs-navbar__item d-none d-lg-block"> <i class="bx bxl-windows"></i> Скачать </nuxt-link>
      </template>
      <template #right>
        <div class="d-flex align-items-center"></div>
      </template>
    </vs-navbar>
    <div id="padding-scroll-content" class="square">
      <div class="container cabinet-container">
        <h1 v-text="name" class="py-3" />
        <div class="row">
          <div class="col">
            <div class="panel cabinet-tab-panel mb-4">
              <nuxt-link to="/cabinet"> <i class="bx bx-user"></i> Общее </nuxt-link>
              <nuxt-link to="/cabinet/stats"> <i class="bx bx-bar-chart-alt-2"></i> Статистика </nuxt-link>
              <nuxt-link to="/cabinet/donate"> <i class="bx bx-crown"></i> Донат </nuxt-link>
              <nuxt-link to="/cabinet/settings"> <i class="bx bx-edit-alt"></i> Настройки и безопасность </nuxt-link>
              <nuxt-link to="/cabinet/payment"> <i class="bx bx-wallet-alt"></i> Пополнение и перевод </nuxt-link>
              <nuxt-link to="/cabinet/history"> <i class="bx bx-history"></i> Транзакции и покупки </nuxt-link>
              <nuxt-link to="/cabinet/auth"> <i class="bx bx-bug"></i> История авторизаций </nuxt-link>
              <nuxt-link to="/cabinet/referals"> <i class="bx bxs-megaphone"></i> Рефералы </nuxt-link>
              <nuxt-link to="/cabinet/gifts"> <i class="bx bx-party"></i> Бонусы </nuxt-link>
            </div>
          </div>
          <div class="col-xl-9 pe-xl-5">
            <div class="panel px-0 py-4">
              <nuxt-child />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import SkinViewer2D from '../../admin/components/SkinView2D.vue'

export default {
  computed: {
    ...mapGetters({
      name: 'unicore/name',
    }),
  },
  components: {
    SkinViewer2D,
  },
}
</script>

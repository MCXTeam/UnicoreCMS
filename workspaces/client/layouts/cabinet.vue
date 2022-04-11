<template>
  <no-ssr>
    <div>
      <vs-navbar class="cabinet-navbar" not-line fixed center-collapsed>
        <template #left>
          <vs-button @click="activeSidebar = true" class="d-lg-none d-md-block me-4" flat icon>
            <i class="bx bx-menu"></i>
          </vs-button>
          <nuxt-link to="/" class="d-flex align-items-center without-underline">
            <img class="my-1" src="/icon.png" height="64px" />
            <h2 class="ms-3 my-0 d-none d-md-block" v-text="$config.sitename" />
          </nuxt-link>
          <nuxt-link to="/cabinet" class="vs-navbar__item d-none d-lg-block ms-4"> <i class="bx bx-user"></i> Личный кабинет </nuxt-link>
          <nuxt-link to="/store" class="vs-navbar__item d-none d-lg-block"> <i class="bx bx-cart"></i> Магазин </nuxt-link>
          <nuxt-link to="/players" class="vs-navbar__item d-none d-lg-block"> <i class="bx bx-stats"></i> Игроки </nuxt-link>
          <nuxt-link to="/start" class="vs-navbar__item d-none d-lg-block"> <i class="bx bxl-windows"></i> Скачать </nuxt-link>
        </template>
        <template #right>
          <div class="d-flex align-items-center p-2">
            <Avatar class="rounded shadow">
              <SkinView2D class="rounded" :width="32" :height="32" :skin="$auth.user.skin" />
            </Avatar>
            <div class="ms-3">
              <h4 class="d-block d-lg-none m-0">{{ $auth.user.username }}</h4>
              <h4 class="d-none d-lg-block m-0">Привет, {{ $auth.user.username }}</h4>
              <h5 class="m-0">Баланс: {{ $utils.formatCurrency($auth.user.real) }}</h5>
            </div>
            <vs-button @click="$unicore.logout()" transparent class="ms-2 d-none d-lg-block" size="large" danger>
              <i class="bx bx-exit"></i>
            </vs-button>
            <div class="d-none d-lg-block" style="font-size: 1.5rem">
              <i v-if="$colorMode.preference == 'light'" @click="$unicore.switchTheme()" class="bx bxs-sun" style="cursor: pointer"></i>
              <i v-else @click="$unicore.switchTheme()" class="bx bxs-moon" style="cursor: pointer"></i>
            </div>
          </div>
        </template>
      </vs-navbar>

      <vs-sidebar absolute :open.sync="activeSidebar">
        <template #logo>
          <img src="/icon.png" />
          <h2 class="ms-2 my-0" v-text="$config.sitename" />
        </template>
        <nuxt-link to="/">
          <vs-sidebar-item class="exact">
            <template #icon>
              <i class="bx bx-home"></i>
            </template>
            Главная
          </vs-sidebar-item>
        </nuxt-link>
        <nuxt-link to="/cabinet">
          <vs-sidebar-item>
            <template #icon>
              <i class="bx bx-user"></i>
            </template>
            Личный кабинет
          </vs-sidebar-item>
        </nuxt-link>
        <nuxt-link to="/store">
          <vs-sidebar-item>
            <template #icon>
              <i class="bx bx-cart"></i>
            </template>
            Магазин
          </vs-sidebar-item>
        </nuxt-link>
        <nuxt-link to="/players">
          <vs-sidebar-item>
            <template #icon>
              <i class="bx bx-stats"></i>
            </template>
            Игроки
          </vs-sidebar-item>
        </nuxt-link>
        <nuxt-link to="/start">
          <vs-sidebar-item>
            <template #icon>
              <i class="bx bxl-windows"></i>
            </template>
            Скачать
          </vs-sidebar-item>
        </nuxt-link>
        <template #footer>
          <no-ssr>
            <vs-row justify="space-between" class="d-flex align-items-center">
              <vs-avatar>
                <SkinView2D class="rounded" :width="48" :height="48" :skin="$auth.user.skin" />
              </vs-avatar>
              <div class="d-flex flex-column justify-content-center">
                <h4 class="m-0">{{ $auth.user.username }}</h4>
                <h5 class="m-0">Баланс: {{ $utils.formatCurrency($auth.user.real) }}</h5>
              </div>
              <vs-avatar @click="$unicore.logout()">
                <i class="bx bx-power-off"></i>
              </vs-avatar>
            </vs-row>
          </no-ssr>
        </template>
      </vs-sidebar>

      <div class="container cabinet-container unicore-content">
        <h1 v-text="name" class="py-3" />
        <div class="row">
          <div class="col">
            <div class="panel cabinet-tab-panel mb-4" v-if="$route.path.startsWith('/cabinet')">
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
            <div v-else-if="$route.path.startsWith('/store')">
              <div class="panel cabinet-tab-panel mb-4">
                <nuxt-link class="no-exact" to="/store/products"> <i class="bx bx-store"></i> Товары </nuxt-link>
                <nuxt-link class="no-exact" to="/store/cart"> <i class="bx bx-cart-alt"></i> Корзина </nuxt-link>
                <nuxt-link class="no-exact" to="/store/warehouse"> <i class="bx bx-package"></i> Склад </nuxt-link>
              </div>
            </div>
            <div v-else-if="$route.path.startsWith('/players')">
              <div class="panel cabinet-tab-panel mb-4">
                <nuxt-link class="no-exact" to="/players/votes"> <i class="bx bx-party"></i> Топ голосующих </nuxt-link>
                <nuxt-link class="no-exact" to="/players/playtime"> <i class="bx bx-game"></i> Топ онлайна </nuxt-link>
                <nuxt-link class="no-exact" to="/players/banlist"> <i class="bx bxs-shield-alt-2"></i> Банлист </nuxt-link>
              </div>
            </div>
            <component v-if="sidebar_component" :is="sidebar_component.component" v-bind="sidebar_component.payload" />
          </div>
          <div class="col-xl-9 pe-xl-5">
            <div class="panel px-0 py-4">
              <nuxt-child />
            </div>
          </div>
        </div>
      </div>
      <Footer style="margin-top: 120px" />
    </div>
  </no-ssr>
</template>

<script>
import { mapGetters } from 'vuex'
import SkinViewer2D from '../../admin/components/SkinView2D.vue'

export default {
  middleware: ['auth', 'verify'],
  head: {
    title: 'Личный кабинет',
  },
  data() {
    return {
      sidebar_component: null,
      activeSidebar: false,
    }
  },
  created() {
    this.$nuxt.$on('setStoreSidebar', ($event) => (this.sidebar_component = $event))
    this.$nuxt.$on(
      'setStoreSidebarLoadingState',
      (loading) => (this.sidebar_component.payload = { ...this.sidebar_component.payload, loading })
    )
  },
  computed: {
    ...mapGetters({
      name: 'unicore/name',
    }),
  },
  methods: {
    updateSidebar(value) {
      alert(1)
    },
  },
  components: {
    SkinViewer2D,
  },
  watch: {
    async $route(to, from) {
      this.$nextTick(() => {
        this.activeSidebar = false
      })
    },
  },
}
</script>

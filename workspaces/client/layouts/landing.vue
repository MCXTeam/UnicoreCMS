<template>
  <div>
    <no-ssr>
      <vs-navbar not-line square target-scroll="#padding-scroll-content" padding-scroll center-collapsed>
        <template #left>
          <vs-button @click="activeSidebar = true" class="d-lg-none d-md-block me-4" flat icon>
            <i class="bx bx-menu"></i>
          </vs-button>
          <nuxt-link to="/" class="d-flex align-items-center without-underline">
            <img class="my-1" src="/icon.png" height="64px" />
            <h2 class="ms-3 my-0 d-none d-md-block" v-text="$config.sitename" />
          </nuxt-link>
          <nuxt-link to="/servers" class="vs-navbar__item d-none d-lg-block ms-4"> <i class="bx bx-server"></i> Серверы </nuxt-link>
          <a href="#" class="vs-navbar__item d-none d-lg-block"> <i class="bx bx-chat"></i> Форум </a>
          <nuxt-link to="/page/rules" class="vs-navbar__item d-none d-lg-block"> <i class="bx bx-paperclip"></i> Правила </nuxt-link>
          <nuxt-link to="/donate" class="vs-navbar__item d-none d-lg-block"> <i class="bx bx-donate-heart"></i> Донат </nuxt-link>
        </template>
        <template #right>
          <no-ssr>
            <div class="d-flex align-items-center" v-if="$auth.loggedIn">
              <vs-button to="/start" size="large">Скачать лаунчер <i class="bx bxl-windows"></i></vs-button>
            </div>
            <div class="d-flex" v-else>
              <vs-button to="/auth" class="d-none d-md-block" size="large" transparent>Войти</vs-button>
              <vs-button to="/start" size="large">Начать игру <i class="bx bx-play"></i></vs-button>
            </div>
          </no-ssr>
          <div class="ms-2 d-none d-lg-block" style="font-size: 1.5rem">
            <i v-if="$colorMode.preference == 'light'" @click="$unicore.switchTheme()" class="bx bxs-sun" style="cursor: pointer"></i>
            <i v-else @click="$unicore.switchTheme()" class="bx bxs-moon" style="cursor: pointer"></i>
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
        <nuxt-link to="/servers">
          <vs-sidebar-item>
            <template #icon>
              <i class="bx bx-server"></i>
            </template>
            Серверы
          </vs-sidebar-item>
        </nuxt-link>
        <a href="/" target="_blank">
          <vs-sidebar-item>
            <template #icon>
              <i class="bx bx-chat"></i>
            </template>
            Форум
          </vs-sidebar-item>
        </a>
        <nuxt-link to="/page/rules">
          <vs-sidebar-item>
            <template #icon>
              <i class="bx bx-paperclip"></i>
            </template>
            Правила
          </vs-sidebar-item>
        </nuxt-link>
        <nuxt-link to="/donate">
          <vs-sidebar-item>
            <template #icon>
              <i class="bx bx-donate-heart"></i>
            </template>
            Донат
          </vs-sidebar-item>
        </nuxt-link>
        <nuxt-link v-if="$auth.user" to="/cabinet">
          <vs-sidebar-item>
            <template #icon>
              <i class="bx bx-user"></i>
            </template>
            Личный кабинет
          </vs-sidebar-item>
        </nuxt-link>
        <nuxt-link v-if="$auth.user" to="/store">
          <vs-sidebar-item>
            <template #icon>
              <i class="bx bx-cart"></i>
            </template>
            Магазин
          </vs-sidebar-item>
        </nuxt-link>
        <nuxt-link v-if="$auth.user" to="/players">
          <vs-sidebar-item>
            <template #icon>
              <i class="bx bx-stats"></i>
            </template>
            Игроки
          </vs-sidebar-item>
        </nuxt-link>
        <template #footer>
          <vs-row v-if="$auth.user" justify="space-between" class="d-flex align-items-center">
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
          <div v-else class="d-flex flex-column align-items-center">
            <vs-button size="xl" to="/auth" class="px-4">Войти</vs-button>
            <div class="d-flex mt-1">
              <vs-button to="/auth/register" transparent class="m-0">Регистрация</vs-button>
              <vs-button to="/auth/reset" transparent class="m-0">Сбросить пароль</vs-button>
            </div>
          </div>
        </template>
      </vs-sidebar>
    </no-ssr>
    <div id="padding-scroll-content" ref="scroll_content" class="square">
      <Header />
      <div class="container mt-5">
        <div class="row">
          <div class="col-xl-9 pe-xl-5">
            <nuxt-child />
          </div>
          <div class="col mt-5 mt-xl-0">
            <LandingPanel :onlines="onlines" :config="config" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  </div>
</template>

<script>
import scss from '~/assets/style/_varriables.scss'
import { mapGetters } from 'vuex'

export default {
  head: {
    bodyAttrs: {
      class: 'landing-body',
    },
  },
  data() {
    return {
      scss,
      activeSidebar: false,
    }
  },
  computed: {
    ...mapGetters({
      onlines: 'io/serversOnline',
      config: 'unicore/config',
    }),
  },
  async mounted() {
    this.socket = this.$nuxtSocket({})
    this.socket.emit('servers/online', {}, (res) => {
      this.$store.commit('io/SERVERS_ONLINE', res)
    })
  },
  watch: {
    async $route(to, from) {
      this.$nextTick(() => {
        this.activeSidebar = false
        this.$refs.scroll_content.scroll({ top: 0, behavior: 'smooth' })
      })
    },
  },
}
</script>

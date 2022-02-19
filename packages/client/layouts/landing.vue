<template>
  <div>
    <vs-navbar not-line square target-scroll="#padding-scroll-content" padding-scroll center-collapsed>
      <template #left>
        <vs-button class="d-lg-none d-md-block me-4" flat icon>
          <i class="bx bx-menu"></i>
        </vs-button>
        <img class="my-1" src="/icon.png" height="64px" />
        <h2 class="ms-3 my-0 d-none d-md-block" v-text="$config.name" />
        <vs-navbar-item to="/servers" class="d-none d-lg-block ms-4"> <i class="bx bx-server"></i> Серверы </vs-navbar-item>
        <vs-navbar-item href="#" class="d-none d-lg-block"> <i class="bx bx-chat"></i> Форум </vs-navbar-item>
        <vs-navbar-item to="/page/rules" class="d-none d-lg-block"> <i class="bx bx-paperclip"></i> Правила </vs-navbar-item>
        <vs-navbar-item to="/donate" class="d-none d-lg-block"> <i class="bx bx-donate-heart"></i> Донат </vs-navbar-item>
      </template>
      <template #right>
        <div class="d-flex">
          <vs-button v-if="$auth.loggedIn" to="/download" size="large">Скачать лаунчер <i class="bx bxl-windows"></i></vs-button>
          <div class="d-flex" v-else>
            <vs-button to="/auth" class="d-none d-md-block" size="large" transparent>Войти</vs-button>
            <vs-button to="/start" size="large">Начать игру <i class="bx bx-play"></i></vs-button>
          </div>
        </div>
        <div class="ms-2 d-none d-lg-block" style="font-size: 1.5rem">
          <i v-if="$colorMode.preference == 'light'" @click="switchTheme" class="bx bxs-sun" style="cursor: pointer"></i>
          <i v-else @click="switchTheme" class="bx bxs-moon" style="cursor: pointer"></i>
        </div>
      </template>
    </vs-navbar>
    <Sidebar />
    <div id="padding-scroll-content" class="square">
      <Header />
      <div class="container mt-5">
        <div class="row">
          <div class="col-xl-9 pe-xl-5">
            <nuxt-child />
          </div>
          <div class="col">
            <div class="panel d-flex flex-column align-items-center py-4 mb-5">
              <SkinViewer2D />
              <h2 class="mb-4 mt-0"><i class="bx bx-key"></i> Авторизация</h2>
              <vs-button to="/auth" size="xl" class="px-4">Войти</vs-button>
              <div class="d-flex mt-3">
                <vs-button to="/auth/register" transparent class="m-0">Регистрация</vs-button>
                <vs-button to="/auth/reset" transparent class="m-0">Сбросить пароль</vs-button>
              </div>
            </div>
            <div class="panel d-flex flex-column align-items-center text-center py-4 mb-5">
              <h2 class="mb-4 mt-0"><i class="bx bx-gift"></i> Голосование</h2>
              <img src="/images/chest-minecraft.gif" height="180px" />
              <p class="mb-3">Голосуй за нас и получай приятные бонусы: игровую валюту, кейсы, предметы!</p>
              <div class="d-flex">
                <vs-button to="/cabinet/gifts" transparent class="m-0" size="large">Голосовать</vs-button>
              </div>
            </div>
            <h2 class="mt-0">Серверы</h2>
            <div v-if="onlines.servers.length" class="">
              <div v-for="online in onlines.servers" :key="online.server.id" class="mb-4">
                <div class="onlines d-flex justify-content-between align-items-end mb-3">
                  <div class="d-flex">
                    <Avatar v-if="online.server.icon" size="xlarge" :image="`${$config.apiUrl}/${online.server.icon}`"> </Avatar>
                    <Avatar v-else size="xlarge"> <i class="bx bxs-server"></i> </Avatar>
                    <div class="ms-3">
                      <span>Версия: {{ online.server.version }}</span>
                      <h3 class="mb-1 mt-0">{{ online.server.name }}</h3>
                    </div>
                  </div>
                  <div class="d-flex flex-column align-items-end">
                    <vs-tooltip>
                      <h2 v-if="online.online" class="mb-1 mt-0"><number :to="online.players" :duration="1" /></h2>
                      <h2 v-else class="mb-1 mt-0 text-uppercase">Off</h2>
                      <template #tooltip>
                        Рекорд: <number :to="online.record" :duration="1" /> / Сегодня: <number :to="online.record_today" :duration="1" />
                      </template>
                    </vs-tooltip>
                    <span v-if="online.online">из {{ online.maxplayers }}</span>
                  </div>
                </div>
                <ProgressBar style="height: 0.5em" :showValue="false" :value="(online.players / online.maxplayers) * 100" />
              </div>
              <div class="text-center">
                <p class="m-0">
                  Общий онлайн: <b><number :to="onlines.total.online" :duration="1" /></b>
                </p>
                <vs-tooltip>
                  <p class="m-0">
                    Рекорд за сегодня: <b><number :to="onlines.total.records.today.online" :duration="1" /></b>
                  </p>
                  <template #tooltip>{{ $moment(onlines.total.records.today.created).local().format('D MMMM YYYY, HH:mm') }}</template>
                </vs-tooltip>
                <vs-tooltip>
                  <p class="m-0">
                    Рекорд за всё время: <b><number :to="onlines.total.records.absolute.online" :duration="1" /></b>
                  </p>
                  <template #tooltip>{{ $moment(onlines.total.records.absolute.created).local().format('D MMMM YYYY, HH:mm') }}</template>
                </vs-tooltip>
              </div>
            </div>
            <div v-else class="d-flex flex-column align-items-center">
              <div class="d-flex w-100" v-for="(n, index) in 3" :key="index">
                <Skeleton size="4rem" class="me-2 mb-3"></Skeleton>
                <div style="flex: 1">
                  <Skeleton width="100%" class="mb-2"></Skeleton>
                  <Skeleton width="75%"></Skeleton>
                </div>
              </div>
              <Skeleton width="70%" class="my-2"></Skeleton>
              <Skeleton width="70%" class="mb-2"></Skeleton>
              <Skeleton width="70%" class="mb-2"></Skeleton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import scss from '~/assets/style/_varriables.scss'
import { mapGetters } from 'vuex'
import SkinViewer2D from '../../admin/components/SkinView2D.vue'

export default {
  data() {
    return {
      scss,
    }
  },
  components: {
    SkinViewer2D
  },
  computed: {
    ...mapGetters({
      onlines: 'io/serversOnline',
    }),
  },
  async mounted() {
    this.socket = this.$nuxtSocket({})
    this.socket.emit('servers/online', {}, (res) => {
      this.$store.commit('io/SERVERS_ONLINE', res)
    })
  },
  methods: {
    switchTheme() {
      if (this.$colorMode.preference == 'light') this.$colorMode.preference = 'dark'
      else this.$colorMode.preference = 'light'
    },
  },
}
</script>

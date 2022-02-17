<template>
  <div>
    <vs-navbar not-line square target-scroll="#padding-scroll-content" padding-scroll center-collapsed>
      <template #left>
        <vs-button class="d-lg-none d-md-block me-4" flat icon>
          <i class="bx bx-menu"></i>
        </vs-button>
        <img class="my-1" src="/icon.png" height="64px" />
        <h2 class="ms-3 my-0 d-none d-md-block">UnicoreCMS</h2>
        <vs-navbar-item class="d-none d-lg-block ms-4"> <i class="bx bx-server"></i> Серверы </vs-navbar-item>
        <vs-navbar-item class="d-none d-lg-block"> <i class="bx bx-chat"></i> Форум </vs-navbar-item>
        <vs-navbar-item class="d-none d-lg-block"> <i class="bx bx-paperclip"></i> Правила </vs-navbar-item>
        <vs-navbar-item class="d-none d-lg-block"> <i class="bx bx-donate-heart"></i> Донат </vs-navbar-item>
      </template>
      <template #right>
        <vs-button size="large" transparent>Войти</vs-button>
        <vs-button size="large">Начать игру <i class="bx bx-play"></i></vs-button>
        <div class="ms-2" style="font-size: 1.5rem">
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
          <div class="col-xl-8">
            <nuxt-child />
          </div>
          <div class="col ps-xl-4">
            <h2 class="mt-0">Серверы</h2>
            <div v-if="onlines.servers.length" class="">
              <div v-for="online in onlines.servers" :key="online.server.id" class="mb-4">
                <div class="onlines d-flex justify-content-between align-items-end mb-3">
                  <div class="d-flex">
                    <Avatar v-if="online.server.icon" size="xlarge" :image="`${$config.apiUrl}/${online.server.icon}`"> </Avatar>
                    <Avatar v-else size="xlarge"> <i class="bx bxs-server"></i> </Avatar>
                    <div class="ms-3">
                      <h3 class="mb-1 mt-0" v-text="online.server.name" />
                      <span v-text="online.server.slogan" />
                    </div>
                  </div>
                  <div class="d-flex flex-column align-items-end">
                    <vs-tooltip>
                      <h2 class="mb-1 mt-0" v-text="online.players" />
                      <template #tooltip> Рекорд: {{ online.record }} / Сегодня: {{ online.record_today }} </template>
                    </vs-tooltip>
                    <span>из {{ online.maxplayers }}</span>
                  </div>
                </div>
                <ProgressBar style="height: 0.5em" :showValue="false" :value="(online.players / online.maxplayers) * 100" />
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

export default {
  data() {
    return {
      scss,
    }
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

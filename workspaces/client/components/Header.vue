<template>
  <div class="header" :class="$route.path != '/' && 'header-sm'">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 250" class="header-waves">
      <path
        fill="currnetColor"
        fill-opacity="1"
        d="M0,64L48,96C96,128,192,192,288,218.7C384,245,480,235,576,218.7C672,203,768,181,864,160C960,139,1056,117,1152,122.7C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      ></path>
    </svg>
    <div class="container">
      <div class="h-100 d-flex flex-column justify-content-center">
        <div class="header-content">
          <h1 class="mb-3"><b v-text="$config.name" /> - Ваш сайт готов к работе</h1>
          <p class="mt-0 mb-2">
            Next-gen Headless система управления контентом и электронная коммерция для Minecraft <br />
            написанная на NestJS и NuxtJS
          </p>
          <div class="d-flex justify-content-between mt-4" style="max-width: 250px">
            <div>
              <div class="d-flex align-items-center">
                <div class="circle me-2" />
                <span class="text-uppercase">В игре</span>
              </div>
              <h1 class="mt-2"><number :to="onlines.total.online" :duration="1" /></h1>
            </div>
            <div>
              <div class="d-flex align-items-center">
                <div class="circle me-2" />
                <span class="text-uppercase">Всего</span>
              </div>
              <h1 class="mt-2"><number :to="users" :duration="1" /></h1>
            </div>
          </div>
          <div class="mt-4 download-content" style="max-width: 400px">
            <vs-button :href="config.public_launcher_exe" target="download" block class="mb-2" size="xl">Скачать лаунчер <i class="bx bxl-windows ms-2"></i></vs-button>
            <div class="d-flex justify-content-between">
              <span>Клиент также доступен на</span>
              <div class="d-flex">
                <vs-button :href="config.public_launcher_jar" target="download" transparent class="m-0">Linux</vs-button>
                <vs-button :href="config.public_launcher_jar" target="download" transparent class="m-0">MacOS</vs-button>
              </div>
            </div>
          </div>
        </div>
        <div class="header-content-sm">
          <h1 class="mb-3" v-text="name" />
        </div>
      </div>
      <img class="header-render d-none d-lg-block" src="/images/render.png" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      users: 0,
    }
  },
  async fetch() {
    this.users = await this.$axios.get('http://localhost:5000/users/count').then((res) => res.data)
  },
  computed: {
    ...mapGetters({
      onlines: 'io/serversOnline',
      name: 'unicore/name',
      config: 'unicore/config',
    }),
  },
}
</script>

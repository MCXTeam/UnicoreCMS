<template>
  <div>
    <p class="m-0">
      Добро пожаловать на наш милый и уютный проект! Уделите нам всего лишь пару минут Вашего времени и окажитесь в игре на наших серверах
      прямо сейчас!
    </p>
    <div class="mt-5 start-blocks">
      <div class="start-block d-flex">
        <div class="start-block-index">#1</div>
        <div>
          <h1>Регистрация на сайте</h1>
          <p>
            У нас собственная система авторизации, потому для начала Вам необходимо зарегистрироваться, не забыв перед этим ознакомиться с
            нашими правилами.
          </p>
          <no-ssr>
            <div v-if="!$auth.loggedIn" class="d-flex flex-wrap">
              <vs-button size="xl" to="/auth/register">Зарегистрироваться</vs-button>
              <vs-button size="xl" to="/auth">Войти</vs-button>
            </div>
            <div v-else-if="$auth.user" class="d-flex align-items-center p-2">
              <Avatar class="rounded shadow">
                <SkinView2D class="rounded" :width="32" :height="32" :skin="$auth.user.skin" />
              </Avatar>
              <div class="ms-3">
                <h2 class="m-0">Привет, {{ $auth.user.username }}</h2>
              </div>
            </div>
          </no-ssr>
        </div>
      </div>
      <div class="start-block d-flex">
        <div class="start-block-index">#2</div>
        <div>
          <h1>Скачать наш лаунчер</h1>
          <p class="mb-0">
            Для игры Вам необходимо скачать наш лаунчер, который сам автоматически установит и настроит всё необходимое, от Вас требуется
            его только запустить!
          </p>
          <p>
            Также для работы лаунчера, необходиом скачать <a href="https://www.java.com/ru/download/manual.jsp" target="_blank">JRE</a> и
            установить её.
          </p>
          <div class="mt-4 download-content" style="max-width: 400px">
            <vs-button :href="config.public_launcher_exe" target="download" block class="mb-2" size="xl"
              >Скачать лаунчер <i class="bx bxl-windows ms-2"></i
            ></vs-button>
            <div class="d-flex justify-content-between">
              <span>Клиент также доступен на</span>
              <div class="d-flex">
                <vs-button :href="config.public_launcher_jar" target="download" transparent class="m-0">Linux</vs-button>
                <vs-button :href="config.public_launcher_jar" target="download" transparent class="m-0">MacOS</vs-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="start-block d-flex">
        <div class="start-block-index">#3</div>
        <div>
          <h1>Приступить к игре</h1>
          <p>
            Поздравляем, Вы великолепны! Теперь осталось только выбрать сервер по Вашему вкусу и приступить к игре. При возникновении
            проблем обратитесь в группу ВКонтакте или на наш форум.
          </p>
          <vs-button size="xl" to="/servers">Серверы</vs-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  layout: 'landing',

  head: {
    title: 'Начать игру',
  },

  computed: {
    ...mapGetters({
      config: 'unicore/config',
    }),
  },

  mounted() {
    if (this.$route.query.ref && process.client) {
      localStorage.setItem('ref', this.$route.query.ref)
    }
  },

  asyncData({ store, $config }) {
    store.commit('unicore/SET_NAME', `Начать игру на ${$config.sitename}`)
  },
}
</script>

<template>
  <footer class="app-footer">
    <div class="container">
      <div class="row">
        <div class="col-auto">
          <img height="100px" src="/icon.png" />
        </div>
        <div class="col-xl-6">
          <h3 class="mt-0 mb-1">© {{ $moment().format('YYYY') }} {{ $config.name }}</h3>
          <p class="footer-desc">
            Все права защищены. Копирование материалов сайта запрещено. Мы предоставляем ознакомительный и бесплатный вариант игры
            <a href="https://www.minecraft.net" target="_blank">Minecraft</a>.
          </p>
          <small class="d-flex align-items-center">
            <img class="me-1" height="16px" :src="require('~/assets/images/system-logo.png')" />
            Powered by <a class="ms-1" href="https://unicorecms.ru/" target="_blank">UnicoreCMS</a>
          </small>
        </div>
        <div class="col ms-xl-4">
          <h3 class="mt-0 mb-2">Навигация</h3>
          <div class="row">
            <div class="col links">
              <nuxt-link to="/">Главная</nuxt-link>
              <nuxt-link to="/servers">Серверы</nuxt-link>
              <a href="#" target="_blank">Форум</a>
            </div>
            <div class="col links">
              <nuxt-link to="/start">Начать игру</nuxt-link>
              <nuxt-link to="/start">Скачать лаунчер</nuxt-link>
              <nuxt-link to="/donate">Донат</nuxt-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters({
      name: 'unicore/name',
    }),
  },
}
</script>

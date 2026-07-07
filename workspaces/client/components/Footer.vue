<template>
  <footer class="app-footer">
    <div class="container">
      <div class="row">
        <div class="col-auto">
          <img height="100px" src="/icon.png" />
        </div>
        <div class="col-xl-6">
          <h3 class="mt-0 mb-1">© {{ $moment().format('YYYY') }} {{ $pub.sitename }}</h3>
          <p class="footer-desc">
            Все права защищены. Копирование материалов сайта запрещено. Мы предоставляем ознакомительный и бесплатный вариант игры
            <a href="https://www.minecraft.net" target="_blank">Minecraft</a>.
          </p>
          <small class="d-flex align-items-center">
            <img class="me-1" height="16px" :src="systemLogo" />
            Powered by <a class="ms-1" href="https://unicorecms.ru/" target="_blank">UnicoreCMS</a>
          </small>
        </div>
        <div class="col ms-xl-4">
          <h3 class="mt-0 mb-2">Навигация</h3>
          <div class="row">
            <div class="col links">
              <NuxtLink to="/">Главная</NuxtLink>
              <NuxtLink to="/servers">Серверы</NuxtLink>
              <a href="#" target="_blank">Форум</a>
            </div>
            <div class="col links">
              <NuxtLink to="/start">Начать игру</NuxtLink>
              <NuxtLink to="/start">Скачать лаунчер</NuxtLink>
              <NuxtLink to="/donate">Донат</NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import systemLogo from '~/assets/images/system-logo.png'
</script>

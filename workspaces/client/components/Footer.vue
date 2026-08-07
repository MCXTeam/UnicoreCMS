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
            {{ $t('footer.rights') }}
            <a href="https://www.minecraft.net" target="_blank">Minecraft</a>.
          </p>
          <small class="d-flex align-items-center">
            <img class="me-1" height="16px" :src="systemLogo" />
            {{ $t('footer.powered') }} <a class="ms-1" href="https://unicorecms.ru/" target="_blank">UnicoreCMS</a>
          </small>
        </div>
        <div class="col ms-xl-4">
          <h3 class="mt-0 mb-2">{{ $t('footer.navigation') }}</h3>
          <div class="row">
            <div class="col links">
              <NuxtLink to="/">{{ $t('header.home') }}</NuxtLink>
              <NuxtLink to="/servers">{{ $t('header.servers') }}</NuxtLink>
              <a :href="forumLink" target="_blank">{{ $t('header.forum') }}</a>
            </div>
            <div class="col links">
              <NuxtLink to="/start">{{ $t('header.start') }}</NuxtLink>
              <NuxtLink to="/start">{{ $t('header.download') }}</NuxtLink>
              <NuxtLink to="/donate">{{ $t('header.donate') }}</NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import systemLogo from '~/assets/images/system-logo.png'
import { useConfigStore } from '~/stores/config'

const configStore = useConfigStore()

const forumLink = computed(() => String(configStore.config.public_link_forum ?? ''))
</script>

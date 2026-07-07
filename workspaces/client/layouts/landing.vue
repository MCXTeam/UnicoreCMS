<template>
  <div>
    <ClientOnly>
      <nav class="vs-navbar d-flex align-items-center justify-content-between py-2">
        <div class="d-flex align-items-center">
          <Button @click="activeSidebar = true" class="d-lg-none d-md-block me-4" text>
            <i class="bx bx-menu"></i>
          </Button>
          <NuxtLink to="/" class="d-flex align-items-center without-underline">
            <img class="my-1" src="/icon.png" height="64px" />
            <h2 class="ms-3 my-0 d-none d-md-block">{{ $pub.sitename }}</h2>
          </NuxtLink>
          <NuxtLink to="/servers" class="vs-navbar__item d-none d-lg-block"> <i class="bx bx-server"></i> Серверы </NuxtLink>
          <a :href="config.public_link_forum" target="_blank" class="vs-navbar__item d-none d-lg-block">
            <i class="bx bx-chat"></i> Форум
          </a>
          <NuxtLink to="/page/rules" class="vs-navbar__item d-none d-lg-block"> <i class="bx bx-paperclip"></i> Правила </NuxtLink>
          <NuxtLink to="/donate" class="vs-navbar__item d-none d-lg-block"> <i class="bx bx-donate-heart"></i> Донат </NuxtLink>
        </div>
        <div class="d-flex align-items-center">
          <div class="d-flex align-items-center" v-if="$auth.loggedIn">
            <NuxtLink to="/start"
              ><Button size="large">Скачать лаунчер <i class="bx bxl-windows"></i></Button
            ></NuxtLink>
          </div>
          <div class="d-flex" v-else>
            <NuxtLink to="/auth" class="d-none d-md-block"><Button size="large" text>Войти</Button></NuxtLink>
            <NuxtLink to="/start"
              ><Button size="large">Начать игру <i class="bx bx-play"></i></Button
            ></NuxtLink>
          </div>
          <div class="ms-2 d-none d-lg-block" style="font-size: 1.5rem">
            <i v-if="$colorMode.preference == 'light'" @click="$unicore.switchTheme()" class="bx bxs-sun" style="cursor: pointer"></i>
            <i v-else @click="$unicore.switchTheme()" class="bx bxs-moon" style="cursor: pointer"></i>
          </div>
        </div>
      </nav>
      <Drawer v-model:visible="activeSidebar" class="vs-sidebar">
        <template #header>
          <img src="/icon.png" height="48px" />
          <h2 class="ms-2 my-0">{{ $pub.sitename }}</h2>
        </template>
        <div class="d-flex flex-column h-100">
          <NuxtLink to="/"
            ><span class="vs-sidebar__item exact"><i class="bx bx-home"></i> Главная</span></NuxtLink
          >
          <NuxtLink to="/servers"
            ><span class="vs-sidebar__item"><i class="bx bx-server"></i> Серверы</span></NuxtLink
          >
          <a href="/" target="_blank"
            ><span class="vs-sidebar__item"><i class="bx bx-chat"></i> Форум</span></a
          >
          <NuxtLink to="/page/rules"
            ><span class="vs-sidebar__item"><i class="bx bx-paperclip"></i> Правила</span></NuxtLink
          >
          <NuxtLink to="/donate"
            ><span class="vs-sidebar__item"><i class="bx bx-donate-heart"></i> Донат</span></NuxtLink
          >
          <NuxtLink v-if="$auth.user" to="/cabinet"
            ><span class="vs-sidebar__item"><i class="bx bx-user"></i> Личный кабинет</span></NuxtLink
          >
          <NuxtLink v-if="$auth.user" to="/store"
            ><span class="vs-sidebar__item"><i class="bx bx-cart"></i> Магазин</span></NuxtLink
          >
          <NuxtLink v-if="$auth.user" to="/players"
            ><span class="vs-sidebar__item"><i class="bx bx-stats"></i> Игроки</span></NuxtLink
          >
          <div class="mt-auto">
            <div v-if="$auth.user" class="d-flex align-items-center justify-content-between">
              <Avatar>
                <SkinView2D class="rounded" :width="48" :height="48" :skin="$auth.user.skin" />
              </Avatar>
              <div class="d-flex flex-column justify-content-center">
                <h4 class="m-0">{{ $auth.user.username }}</h4>
                <h5 class="m-0">Баланс: {{ $utils.formatCurrency('real', $auth.user.real) }}</h5>
              </div>
              <Avatar style="cursor: pointer" @click="$unicore.logout()">
                <i class="bx bx-power-off"></i>
              </Avatar>
            </div>
            <div v-else class="d-flex flex-column align-items-center">
              <NuxtLink to="/auth" class="px-4"><Button size="large">Войти</Button></NuxtLink>
              <div class="d-flex mt-1">
                <NuxtLink to="/auth/register"><Button text class="m-0">Регистрация</Button></NuxtLink>
                <NuxtLink to="/auth/reset"><Button text class="m-0">Сбросить пароль</Button></NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </ClientOnly>
    <div id="padding-scroll-content">
      <Header />
      <div class="container mt-5">
        <div class="row">
          <div class="col-xl-9 pe-xl-5">
            <slot />
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

<script setup>
import { useIoStore } from '~/stores/io'
import { useConfigStore } from '~/stores/config'

const route = useRoute()
const { $socket } = useNuxtApp()

const ioStore = useIoStore()
const configStore = useConfigStore()

const onlines = computed(() => ioStore.serversOnline)
const config = computed(() => configStore.config)

const activeSidebar = ref(false)

onMounted(() => {
  $socket?.emit('servers/online', {}, (res) => ioStore.setServersOnline(res))
})

watch(
  () => route.fullPath,
  () => {
    nextTick(() => {
      activeSidebar.value = false
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  },
)
</script>

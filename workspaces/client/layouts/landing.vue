<template>
  <div>
    <ClientOnly>
      <div class="vs-navbar-content paddingScroll" :class="{ paddingScrollActive: scrolled }">
        <nav class="vs-navbar d-flex align-items-center justify-content-between py-2">
          <div class="d-flex align-items-center">
            <Button @click="activeSidebar = true" class="d-lg-none d-md-block me-4" text>
              <i class="bx bx-menu"></i>
            </Button>
            <NuxtLink to="/" class="d-flex align-items-center without-underline">
              <img class="my-1" src="/icon.png" height="64px" />
              <h2 class="ms-3 my-0 d-none d-md-block">{{ $pub.sitename }}</h2>
            </NuxtLink>
            <template v-for="item in navbar" :key="item.key">
              <a v-if="item.href" :href="item.href" target="_blank" class="vs-navbar__item d-none d-lg-block">
                <i :class="item.icon"></i> {{ $t(item.label) }}
              </a>
              <NuxtLink v-else :to="item.to" class="vs-navbar__item d-none d-lg-block">
                <i :class="item.icon"></i> {{ $t(item.label) }}
              </NuxtLink>
            </template>
          </div>
          <div class="d-flex align-items-center">
            <div class="d-flex align-items-center" v-if="$auth.loggedIn">
              <NuxtLink to="/start"
                ><Button size="large">{{ $t('header.download') }} <i class="bx bxl-windows"></i></Button
              ></NuxtLink>
            </div>
            <div class="d-flex" v-else>
              <NuxtLink to="/auth" class="d-none d-md-block"
                ><Button size="large" text>{{ $t('header.login') }}</Button></NuxtLink
              >
              <NuxtLink to="/start"
                ><Button size="large">{{ $t('header.start') }} <i class="bx bx-play"></i></Button
              ></NuxtLink>
            </div>
            <Select
              v-if="locales.length > 1"
              class="ms-2 d-none d-lg-inline-flex locale-select"
              :modelValue="locale"
              @update:modelValue="$setLocale"
              :options="locales"
              optionLabel="name"
              optionValue="code"
            />
            <div class="ms-2 d-none d-lg-block" style="font-size: 1.5rem">
              <i v-if="$colorMode.preference == 'light'" @click="$unicore.switchTheme()" class="bx bxs-sun" style="cursor: pointer"></i>
              <i v-else @click="$unicore.switchTheme()" class="bx bxs-moon" style="cursor: pointer"></i>
            </div>
          </div>
        </nav>
      </div>
      <Drawer v-model:visible="activeSidebar" class="vs-sidebar">
        <template #header>
          <img src="/icon.png" height="48px" />
          <h2 class="ms-2 my-0">{{ $pub.sitename }}</h2>
        </template>
        <div class="d-flex flex-column h-100">
          <NuxtLink to="/"
            ><span class="vs-sidebar__item exact"><i class="bx bx-home"></i> {{ $t('header.home') }}</span></NuxtLink
          >
          <template v-for="item in sidebarNav" :key="item.key">
            <a v-if="item.href" :href="item.href" target="_blank"
              ><span class="vs-sidebar__item"><i :class="item.icon"></i> {{ $t(item.label) }}</span></a
            >
            <NuxtLink v-else :to="item.to"
              ><span class="vs-sidebar__item"><i :class="item.icon"></i> {{ $t(item.label) }}</span></NuxtLink
            >
          </template>
          <div class="mt-auto">
            <div v-if="$auth.user" class="d-flex align-items-center justify-content-between">
              <Avatar>
                <SkinView2D class="rounded" :width="48" :height="48" :skin="$auth.user.skin" />
              </Avatar>
              <div class="d-flex flex-column justify-content-center">
                <h4 class="m-0">{{ $auth.user.username }}</h4>
                <h5 class="m-0">{{ $t('panel.balance', { amount: $utils.formatCurrency('real', $auth.user.real) }) }}</h5>
              </div>
              <Avatar style="cursor: pointer" @click="$unicore.logout()">
                <i class="bx bx-power-off"></i>
              </Avatar>
            </div>
            <div v-else class="d-flex flex-column align-items-center">
              <NuxtLink to="/auth" class="px-4"
                ><Button size="large">{{ $t('header.login') }}</Button></NuxtLink
              >
              <div class="d-flex mt-1">
                <NuxtLink to="/auth/register"
                  ><Button text class="m-0">{{ $t('panel.register') }}</Button></NuxtLink
                >
                <NuxtLink to="/auth/reset"
                  ><Button text class="m-0">{{ $t('panel.reset_password') }}</Button></NuxtLink
                >
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
          <div class="col-xl-9 pe-xl-5 landing-main">
            <slot />
          </div>
          <div class="col mt-5 mt-xl-0 landing-aside">
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
import { useLocale, useLocales } from '~/composables/useLocale'

const route = useRoute()
const { $socket, $setLocale } = useNuxtApp()

const ioStore = useIoStore()
const configStore = useConfigStore()

const onlines = computed(() => ioStore.serversOnline)
const config = computed(() => configStore.config)

const locales = useLocales()
const locale = useLocale()

const navbar = useNavigation('navbar')
const cabinetNav = useNavigation('cabinet')
const sidebarNav = computed(() => [...navbar.value, ...cabinetNav.value])

const activeSidebar = ref(false)
const scrolled = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 0
}

onMounted(() => {
  $socket?.emit('servers/online', {}, (res) => ioStore.setServersOnline(res))
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
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

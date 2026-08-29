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
              <a v-if="!item.module && item.href" :href="item.href" target="_blank" class="vs-navbar__item d-none d-lg-block">
                <i :class="item.icon"></i> {{ $t(item.label) }}
              </a>
              <NuxtLink
                v-else-if="!item.module"
                :to="item.to"
                class="vs-navbar__item d-none d-lg-block"
                :class="{ 'router-link-active': isActive(item) }"
              >
                <i :class="item.icon"></i> {{ $t(item.label) }}
              </NuxtLink>
            </template>

            <div v-if="moduleNav.length" ref="moreWrap" class="navbar-more d-none d-lg-block">
              <button class="vs-navbar__item navbar-more__btn" :aria-expanded="moreOpen" @click.stop="moreOpen = !moreOpen">
                <i class="bx bx-dots-horizontal-rounded"></i> {{ $t('header.more') }}
                <i class="bx bx-chevron-down navbar-more__chevron" :class="{ open: moreOpen }"></i>
              </button>
              <Transition name="more-fade">
                <div v-if="moreOpen" class="navbar-more__menu">
                  <template v-for="item in moduleNav" :key="item.key">
                    <a v-if="item.href" :href="item.href" target="_blank" class="navbar-more__item" @click="moreOpen = false">
                      <i :class="item.icon"></i>
                      <span>{{ $t(item.label) }}</span>
                    </a>
                    <NuxtLink v-else :to="item.to" class="navbar-more__item" @click="moreOpen = false">
                      <i :class="item.icon"></i>
                      <span>{{ $t(item.label) }}</span>
                    </NuxtLink>
                  </template>
                </div>
              </Transition>
            </div>
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
import { useLocale, useLocales } from '~/composables/useLocale'

const route = useRoute()
const { $socket, $setLocale } = useNuxtApp()

const ioStore = useIoStore()

const onlines = computed(() => ioStore.serversOnline)
const { config } = usePublicConfig()

const locales = useLocales()
const locale = useLocale()

const navbar = useNavigation('navbar')
const cabinetNav = useNavigation('cabinet')
const sidebarNav = computed(() => [...navbar.value, ...cabinetNav.value])

const moduleNav = computed(() => navbar.value.filter((item) => item.module))

const moreWrap = ref(null)
const moreOpen = ref(false)
const activeSidebar = ref(false)
const scrolled = ref(false)

function isActive(item) {
  return item.to && (item.to === '/' ? route.path === '/' : route.path.startsWith(item.to))
}

function onScroll() {
  scrolled.value = window.scrollY > 0
}

function onGlobalClick(event) {
  if (!moreOpen.value) return
  if (moreWrap.value?.contains(event.target)) return

  moreOpen.value = false
}

function onKeydown(event) {
  if (event.key === 'Escape') moreOpen.value = false
}

onMounted(() => {
  $socket?.emit('servers/online', {}, (res) => ioStore.setServersOnline(res))
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', onGlobalClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', onGlobalClick)
  document.removeEventListener('keydown', onKeydown)
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

<style scoped lang="scss">
.navbar-more {
  position: relative;
  display: none;

  @media (min-width: 992px) {
    display: block;
  }
}

.navbar-more__btn {
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
}

.navbar-more__chevron {
  font-size: 0.9rem;
  transition: transform 0.15s;

  &.open {
    transform: rotate(180deg);
  }
}

.navbar-more__menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 220px;
  padding: 0.4rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 14px;
  background: var(--vs-theme-layout);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.18);
  z-index: 300;
}

.navbar-more__item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  white-space: nowrap;
  color: var(--vs-text);
  text-decoration: none !important;
  transition: background 0.15s;

  i {
    font-size: 1.1rem;
    color: var(--p-primary-color);
  }

  &:hover {
    background: rgba(var(--vs-text), 0.06);
  }
}

.more-fade-enter-active,
.more-fade-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.more-fade-enter-from,
.more-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -4px);
}

.locale-select.p-select {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

.locale-select.p-select:not(.p-disabled):hover,
.locale-select.p-select.p-focus {
  border-color: var(--p-content-border-color);
}

.locale-select :deep(.p-select-label) {
  padding: 0.3rem 0.4rem;
  color: var(--p-text-muted-color);
}

.locale-select :deep(.p-select-dropdown) {
  width: 1.75rem;
  color: var(--p-text-muted-color);
}
</style>

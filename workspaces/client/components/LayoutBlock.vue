<template>
  <div v-if="visible" class="layout-block" :class="[`layout-block--${block.type}`, { 'layout-block--grow': block.grow }, hideClass]">
    <h3 v-if="titleText" class="layout-block__title">{{ titleText }}</h3>

    <NuxtLink v-if="block.type === 'logo'" to="/" class="layout-block__logo without-underline">
      <img :src="block.image || '/icon.png'" :height="`${block.size || 64}px`" />
      <span v-if="place === 'header'" class="layout-block__logo-name d-none d-md-block">{{ $pub.sitename }}</span>
    </NuxtLink>

    <a v-else-if="block.type === 'image' && block.href" :href="block.href" class="layout-block__image">
      <img :src="block.image" :height="`${block.size || 100}px`" />
    </a>
    <img v-else-if="block.type === 'image'" class="layout-block__image" :src="block.image" :height="`${block.size || 100}px`" />

    <div v-else-if="block.type === 'text'" class="layout-block__text" v-html="$sanitize(textValue)" />

    <div v-else-if="block.type === 'html'" class="layout-block__html" v-html="$sanitize(block.html || '')" />

    <div v-else-if="block.type === 'nav'" class="layout-block__nav" :class="{ 'layout-block__nav--columns': columns > 1 }" :style="navStyle">
      <template v-for="link in links" :key="link.id">
        <a v-if="link.href" :href="link.href" target="_blank" class="layout-link">
          <i v-if="link.icon" :class="link.icon"></i> {{ linkLabel(link) }}
        </a>
        <NuxtLink v-else :to="link.to" class="layout-link">
          <i v-if="link.icon" :class="link.icon"></i> {{ linkLabel(link) }}
        </NuxtLink>
      </template>
      <template v-for="item in inlineModuleLinks" :key="item.key">
        <a v-if="item.href" :href="item.href" target="_blank" class="layout-link">
          <i v-if="item.icon" :class="item.icon"></i> {{ $t(item.label) }}
        </a>
        <NuxtLink v-else :to="item.to" class="layout-link">
          <i v-if="item.icon" :class="item.icon"></i> {{ $t(item.label) }}
        </NuxtLink>
      </template>
      <div v-if="moduleLinks.length" ref="moreWrap" class="layout-more">
        <button class="layout-link layout-more__btn" :aria-expanded="moreOpen" @click.stop="moreOpen = !moreOpen">
          <i class="bx bx-dots-horizontal-rounded"></i> {{ $t('header.more') }}
        </button>
        <Transition name="more-fade">
          <div v-if="moreOpen" class="layout-more__menu">
            <template v-for="item in moduleLinks" :key="item.key">
              <a v-if="item.href" :href="item.href" target="_blank" class="layout-more__item" @click="moreOpen = false">
                <i :class="item.icon"></i><span>{{ $t(item.label) }}</span>
              </a>
              <NuxtLink v-else :to="item.to" class="layout-more__item" @click="moreOpen = false">
                <i :class="item.icon"></i><span>{{ $t(item.label) }}</span>
              </NuxtLink>
            </template>
          </div>
        </Transition>
      </div>
    </div>

    <div v-else-if="block.type === 'icons'" class="layout-block__icons">
      <a v-for="link in links" :key="link.id" :href="link.href || link.to" :target="link.href ? '_blank' : undefined" class="layout-icon">
        <img v-if="link.icon && link.icon.includes('/')" :src="link.icon" :height="`${block.size || 28}px`" />
        <i v-else :class="link.icon || 'bx bx-link'"></i>
        <span v-if="linkLabel(link)" class="layout-icon__label">{{ linkLabel(link) }}</span>
      </a>
    </div>

    <div v-else-if="block.type === 'login'" class="layout-block__login">
      <NuxtLink v-if="$auth.loggedIn" to="/cabinet">
        <Button size="large" text>{{ $t('header.cabinet') }}</Button>
      </NuxtLink>
      <NuxtLink v-else to="/auth">
        <Button size="large" text>{{ $t('header.login') }}</Button>
      </NuxtLink>
    </div>

    <div v-else-if="block.type === 'launcher'" class="layout-block__launcher">
      <NuxtLink to="/start">
        <Button size="large">
          {{ $auth.loggedIn ? $t('header.download') : $t('header.start') }}
          <i :class="$auth.loggedIn ? 'bx bxl-windows' : 'bx bx-play'"></i>
        </Button>
      </NuxtLink>
    </div>

    <Select
      v-else-if="block.type === 'locale' && locales.length > 1"
      class="locale-select"
      :modelValue="locale"
      @update:modelValue="$setLocale"
      :options="locales"
      optionLabel="name"
      optionValue="code"
    />

    <div v-else-if="block.type === 'theme'" class="layout-block__theme" @click="$unicore.switchTheme()">
      <i v-if="$colorMode.preference == 'light'" class="bx bxs-sun"></i>
      <i v-else class="bx bxs-moon"></i>
    </div>

    <NotificationsBell v-else-if="block.type === 'notifications' && $auth.loggedIn" />

    <div v-else-if="block.type === 'online'" class="layout-block__online">
      <span class="layout-block__online-dot" />
      <span>{{ $t('header.online') }}</span>
      <b>{{ onlines.total.online }}</b>
    </div>
  </div>
  <div v-else-if="block.type === 'spacer'" class="layout-spacer" />
</template>

<script setup lang="ts">
import { layoutText, type LayoutBlock, type LayoutLink, type LayoutPlace } from 'unicore-common/layout'

const props = defineProps<{ block: LayoutBlock; place: LayoutPlace }>()

const { $auth, $t, $pub } = useNuxtApp() as any
const locale = useLocale()
const locales = useLocales()
const ioStore = useIoStore()
const { config } = usePublicConfig()
const navigation = useNavigation(props.place === 'footer' ? 'footer' : 'navbar')

const moreWrap = ref<HTMLElement | null>(null)
const moreOpen = ref(false)

const onlines = computed(() => ioStore.serversOnline)

const visible = computed(() => {
  if (props.block.type === 'spacer') return false
  if (props.block.when === 'auth') return $auth.loggedIn
  if (props.block.when === 'guest') return !$auth.loggedIn

  return true
})

const hideClass = computed(() => (props.block.hideOn || []).map((screen) => `layout-hide-${screen}`))

const titleText = computed(() => layoutText(props.block.title, locale.value))

const substitute = (value: string) =>
  value.replace(/\{\{\s*sitename\s*\}\}/g, String($pub.sitename || '')).replace(/\{\{\s*year\s*\}\}/g, String(new Date().getFullYear()))

const textValue = computed(() => substitute(layoutText(props.block.text, locale.value)))

const columns = computed(() => Number(props.block.columns) || 1)

const navStyle = computed(() => (columns.value > 1 ? { columnCount: columns.value } : {}))

const links = computed(() =>
  (props.block.links || [])
    .filter((link) => {
      if (link.when === 'auth') return $auth.loggedIn
      if (link.when === 'guest') return !$auth.loggedIn

      return true
    })
    .map((link) => ({ ...link, href: link.configLink ? String(config.value?.[link.configLink] || '') : link.href }))
    .filter((link) => link.to || link.href),
)

const modulePlaced = computed(() => (props.block.type === 'nav' ? navigation.value.filter((item: any) => item.module) : []))

const inlineModuleLinks = computed(() => modulePlaced.value.filter((item: any) => item.inline))

const moduleLinks = computed(() => modulePlaced.value.filter((item: any) => !item.inline))

const linkLabel = (link: LayoutLink) => (link.labelKey ? $t(link.labelKey) : layoutText(link.label, locale.value))

function onGlobalClick(event: MouseEvent) {
  if (!moreOpen.value) return
  if (moreWrap.value?.contains(event.target as Node)) return

  moreOpen.value = false
}

onMounted(() => document.addEventListener('click', onGlobalClick))
onBeforeUnmount(() => document.removeEventListener('click', onGlobalClick))
</script>

<style scoped>
.layout-block {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.layout-block--grow {
  flex: 1 1 0;
}
.layout-block--text,
.layout-block--nav,
.layout-block--icons {
  flex-direction: column;
  align-items: flex-start;
}
.layout-block__title {
  margin: 0 0 8px;
  font-size: 1.05rem;
}
.layout-block__logo {
  display: flex;
  align-items: center;
  gap: 12px;
}
.layout-block__logo-name {
  font-size: 1.4rem;
  font-weight: 600;
}
.layout-block__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 18px;
}
.layout-block__nav--columns {
  display: block;
}
.layout-block__nav--columns .layout-link {
  display: flex;
  break-inside: avoid;
}
.layout-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 0;
  white-space: nowrap;
}
.layout-block--login :deep(.p-button),
.layout-block--launcher :deep(.p-button) {
  white-space: nowrap;
}
.layout-block__icons {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
}
.layout-icon {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 1.4rem;
}
.layout-icon__label {
  font-size: 0.9rem;
}
.layout-block__theme {
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}
.layout-block__online {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.layout-block__online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
}
.layout-block__text :deep(p) {
  margin: 0;
}
.layout-spacer {
  flex: 1 1 auto;
}
.layout-more {
  position: relative;
}
.layout-more__btn {
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  color: inherit;
}
.layout-more__menu {
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
.layout-more__item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.7rem;
  border-radius: 10px;
}
.layout-render--header .layout-block__nav {
  flex-wrap: nowrap;
}
@media (max-width: 991.98px) {
  .layout-hide-mobile {
    display: none;
  }
}
@media (min-width: 992px) {
  .layout-hide-desktop {
    display: none;
  }
}
</style>

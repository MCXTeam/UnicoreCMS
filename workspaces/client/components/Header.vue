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
          <h1 class="mb-3" v-html="$sanitize($t('header.tagline', { sitename: `<b>${$pub.sitename}</b>` }))" />
          <p class="mt-0 mb-2">{{ $t('header.description') }}</p>
          <div class="d-flex justify-content-between mt-4" style="max-width: 250px">
            <div>
              <div class="d-flex align-items-center">
                <div class="circle me-2" />
                <span class="text-uppercase">{{ $t('header.online') }}</span>
              </div>
              <h1 class="mt-2">
                <ClientOnly>
                  <CountTo :startVal="0" :endVal="onlines.total.online" :duration="1000" />
                  <template #fallback>{{ onlines.total.online }}</template>
                </ClientOnly>
              </h1>
            </div>
            <div>
              <div class="d-flex align-items-center">
                <div class="circle me-2" />
                <span class="text-uppercase">{{ $t('header.total') }}</span>
              </div>
              <h1 class="mt-2">
                <ClientOnly>
                  <CountTo :startVal="0" :endVal="users" :duration="1000" />
                  <template #fallback>{{ users }}</template>
                </ClientOnly>
              </h1>
            </div>
          </div>
          <div class="mt-4 download-content" style="max-width: 400px">
            <Button as="a" :href="config.public_launcher_exe" target="download" class="w-full mb-2" size="large"
              >{{ $t('header.download') }} <i class="bx bxl-windows ms-2"></i
            ></Button>
            <div class="d-flex justify-content-between">
              <span>{{ $t('header.other_platforms') }}</span>
              <div class="d-flex">
                <Button as="a" :href="config.public_launcher_jar" target="download" text class="m-0" label="Linux" />
                <Button as="a" :href="config.public_launcher_jar" target="download" text class="m-0" label="MacOS" />
              </div>
            </div>
          </div>
        </div>
        <div class="header-content-sm">
          <h1 class="mb-3">{{ uiStore.pageName }}</h1>
        </div>
      </div>
      <img class="header-render d-none d-lg-block" src="/images/render.png" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from '~/stores/config'
import { useIoStore } from '~/stores/io'
import { useUiStore } from '~/stores/ui'

const ioStore = useIoStore()
const configStore = useConfigStore()
const uiStore = useUiStore()

const onlines = computed(() => ioStore.serversOnline)
const config = computed(() => configStore.config)

const { data: users } = await usePlayers().count()
</script>

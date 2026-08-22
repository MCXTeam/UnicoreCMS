<template>
  <div>
    <p class="m-0">{{ $t('start.intro') }}</p>
    <div class="mt-5 start-blocks">
      <div class="start-block d-flex">
        <div class="start-block-index">#1</div>
        <div>
          <h1>{{ $t('start.step1_title') }}</h1>
          <p>{{ $t('start.step1_text') }}</p>
          <ClientOnly>
            <div v-if="!$auth.loggedIn" class="d-flex flex-wrap">
              <NuxtLink to="/auth/register" class="me-2 mb-2"><Button :label="$t('auth.sign_up')" size="large" /></NuxtLink>
              <NuxtLink to="/auth" class="mb-2"><Button :label="$t('header.login')" size="large" /></NuxtLink>
            </div>
            <div v-else-if="$auth.user" class="d-flex align-items-center p-2">
              <Avatar class="rounded shadow">
                <SkinView2D class="rounded" :width="32" :height="32" :skin="$auth.user.skin" />
              </Avatar>
              <div class="ms-3">
                <h2 class="m-0">{{ $t('panel.hello', { username: $auth.user.username }) }}</h2>
              </div>
            </div>
          </ClientOnly>
        </div>
      </div>
      <div class="start-block d-flex">
        <div class="start-block-index">#2</div>
        <div>
          <h1>{{ $t('start.step2_title') }}</h1>
          <p class="mb-0">{{ $t('start.step2_text') }}</p>
          <p>
            {{ $t('start.step2_java_before') }}
            <a href="https://www.java.com/ru/download/manual.jsp" target="_blank">JRE</a>
            {{ $t('start.step2_java_after') }}
          </p>
          <div class="mt-4 download-content" style="max-width: 400px">
            <a :href="text('public_launcher_exe')" target="download" class="d-block mb-2">
              <Button size="large" class="w-full">{{ $t('header.download') }} <i class="bx bxl-windows ms-2"></i></Button>
            </a>
            <div class="d-flex justify-content-between">
              <span>{{ $t('header.other_platforms') }}</span>
              <div class="d-flex">
                <a :href="text('public_launcher_jar')" target="download" class="m-0"><Button text label="Linux" /></a>
                <a :href="text('public_launcher_jar')" target="download" class="m-0"><Button text label="MacOS" /></a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="start-block d-flex">
        <div class="start-block-index">#3</div>
        <div>
          <h1>{{ $t('start.step3_title') }}</h1>
          <p>{{ $t('start.step3_text') }}</p>
          <NuxtLink to="/servers"><Button :label="$t('header.servers')" size="large" /></NuxtLink>
        </div>
      </div>
    </div>
    <ExtensionSlot name="start.page" />
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'landing' })

const { $pub, $t } = useNuxtApp()
const { config, text } = usePublicConfig()

useHead({ title: computed(() => $t('header.start')) })
useUiStore().setName($t('start.page_name', { sitename: $pub.sitename }))

const route = useRoute()

onMounted(() => {
  if (route.query.ref) localStorage.setItem('ref', String(route.query.ref))
})
</script>

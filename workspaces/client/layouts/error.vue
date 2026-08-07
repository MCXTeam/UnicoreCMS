<template>
  <div class="vh-100 vw-100 d-flex align-items-center justify-content-center error-layout">
    <div class="panel d-flex flex-column align-items-center justify-content-center px-5">
      <div class="d-flex align-items-center">
        <img class="my-1" src="/icon.png" height="64px" />
        <h2 class="ms-3 my-0 d-none d-md-block">{{ $pub.sitename }}</h2>
      </div>
      <h1 v-if="error?.statusCode == 404">{{ $t('error.not_found') }}</h1>
      <span>{{ $t('error.occurred', { code: error?.statusCode }) }}</span>
      <p class="text-center" v-if="error?.statusCode == 429">{{ $t('error.too_many_requests') }}</p>
      <NuxtLink to="/" class="mt-4">
        <Button text size="large"><i class="bx bx-left-arrow-alt"></i> {{ $t('error.to_home') }}</Button>
      </NuxtLink>
    </div>
    <img class="header-render d-none d-lg-block" src="/images/render.png" />
  </div>
</template>

<script setup>
defineProps({
  error: {
    type: Object,
    default: () => null,
  },
})

const { $t } = useNuxtApp()

useHead({ title: computed(() => $t('error.title')) })
</script>

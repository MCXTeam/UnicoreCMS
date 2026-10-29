<template>
  <div class="min-vh-100 w-100 d-flex align-items-center justify-content-center auth-layout p-3">
    <div v-for="(n, index) in 15" :key="index" class="firefly d-none d-xl-block" aria-hidden="true" />
    <div data-aos-delay="50" data-aos="fade-left" class="panel d-flex flex-column align-items-center">
      <NuxtLink data-aos="zoom-in-right" to="/">
        <img src="/icon.png" :alt="$pub.sitename" height="128px" />
      </NuxtLink>
      <slot />
    </div>
    <img
      data-aos-anchor="body"
      data-aos-delay="300"
      data-aos="fade-left"
      class="header-render d-none d-lg-block"
      src="/images/render.png"
      alt=""
    />
  </div>
</template>

<script setup>
const { $t } = useNuxtApp()

useHead({
  title: computed(() => $t('panel.auth')),
  bodyAttrs: { class: 'auth-body' },
})
</script>

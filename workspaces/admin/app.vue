<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toast />
  <ConfirmDialog />
</template>

<script setup lang="ts">
const { sitename } = useRuntimeConfig().public

useHead({ titleTemplate: `%s - ${sitename}` })
</script>

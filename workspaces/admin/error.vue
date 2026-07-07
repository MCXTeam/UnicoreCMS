<template>
  <NuxtLayout name="empty">
    <div class="flex flex-column align-items-center justify-content-center" style="min-height: 100vh; gap: 1rem">
      <h1 style="font-size: 6rem; margin: 0">{{ error?.statusCode || 500 }}</h1>
      <p style="opacity: 0.7">{{ error?.message || 'Что-то пошло не так' }}</p>
      <Button label="На главную" icon="pi pi-home" @click="handleError" />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode?: number; message?: string } | null }>()

const handleError = () => clearError({ redirect: '/' })
</script>

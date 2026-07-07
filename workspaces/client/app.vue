<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toast position="top-right" />
  <ConfirmDialog />
  <div v-if="ui.loading" class="unicore-loading-overlay">
    <ProgressSpinner />
    <span v-if="ui.loadingText" class="unicore-loading-text">{{ ui.loadingText }}</span>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

const ui = useUiStore()
</script>

<style>
.unicore-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.45);
}

.unicore-loading-text {
  color: #fff;
  font-size: 1rem;
}
</style>

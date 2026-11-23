<template>
  <img
    :src="failed ? '/icon.png' : $pub.projectLogo"
    @error="failed = true"
    :alt="$pub.sitename"
    :width="size"
    :height="size"
    :style="{ inlineSize: `${size}px`, blockSize: `${size}px` }"
    class="project-logo"
  />
</template>

<script setup lang="ts">
const { $pub } = useNuxtApp()
const failed = ref(false)
watch(
  () => $pub.projectLogo,
  () => {
    failed.value = false
  },
)
withDefaults(defineProps<{ size?: number }>(), { size: 64 })
</script>

<style scoped>
.project-logo {
  max-inline-size: 100%;
  object-fit: contain;
  flex-shrink: 0;
}
</style>

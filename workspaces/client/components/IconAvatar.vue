<template>
  <Avatar v-if="src" ref="avatar" :image="src" :size="size" :shape="shape" @error="broken = true" />
  <Avatar v-else :size="size" :shape="shape"><i :class="icon" /></Avatar>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    path?: string | null
    icon?: string
    size?: 'normal' | 'large' | 'xlarge'
    shape?: 'square' | 'circle'
  }>(),
  {
    path: null,
    icon: 'bx bxs-image',
    size: 'normal',
    shape: 'square',
  },
)

const apiUrl = useRuntimeConfig().public.apiBaseurl
const avatar = ref(null)
const broken = ref(false)

const src = computed(() => (props.path && !broken.value ? `${apiUrl}/${props.path}` : null))

function checkLoaded() {
  const image = (avatar.value as any)?.$el?.querySelector?.('img')

  if (image?.complete && !image.naturalWidth) broken.value = true
}

onMounted(checkLoaded)

watch(
  () => props.path,
  () => (broken.value = false),
)
</script>

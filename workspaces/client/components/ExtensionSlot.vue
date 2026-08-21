<template>
  <component v-for="entry in entries" :key="`${entry.slot}-${entry.component}`" :is="entry.component" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { clientSlots } from 'unicore-api/client'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{ name: string }>()

defineOptions({ inheritAttrs: false })

const auth = useAuthStore()

const entries = computed(() =>
  clientSlots(props.name).filter((entry) => {
    if (entry.when === 'auth') return auth.loggedIn
    if (entry.when === 'guest') return !auth.loggedIn

    return true
  }),
)
</script>

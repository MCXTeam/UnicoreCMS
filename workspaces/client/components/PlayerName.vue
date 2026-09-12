<template>
  <span class="player-name" :class="{ 'player-name--stacked': stacked }">
    <span v-if="badge && badgeBefore" :class="badgeClass" :style="badgeStyle">{{ activeRole?.name }}</span>
    <span :style="nameStyle">{{ username }}</span>
    <span v-if="badge && !badgeBefore" :class="badgeClass" :style="badgeStyle">{{ activeRole?.name }}</span>
  </span>
</template>

<script setup lang="ts">
import { displayRole, roleBadgeClass, roleBadgeStyle, roleNameStyle, type RoleAppearance } from 'unicore-common/roles'

const props = defineProps<{
  username: string
  role?: RoleAppearance | null
  roles?: RoleAppearance[] | null
  stacked?: boolean
}>()

const { $pub } = useNuxtApp()
const { value } = usePublicConfig()

const activeRole = computed(() => props.role ?? displayRole(props.roles))
const badge = computed(() => !!activeRole.value?.badge && !!activeRole.value?.name)
const badgeBefore = computed(() => !!value('public_role_badge_before', false))
const badgeClass = computed(() => roleBadgeClass(activeRole.value))
const badgeStyle = computed(() => roleBadgeStyle(activeRole.value, `${$pub.apiBaseurl}/`))
const nameStyle = computed(() => roleNameStyle(activeRole.value))
</script>

<style scoped>
.player-name {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
}
.player-name--stacked {
  flex-direction: column;
  gap: 0.35em;
}
</style>

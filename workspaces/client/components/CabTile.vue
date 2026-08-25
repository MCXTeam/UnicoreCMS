<template>
  <section :class="['cab-tile', `cab-span-${span}`, { 'cab-tile--accent': accent }]">
    <div v-if="title || $slots.actions" class="cab-tile__head">
      <h3 class="cab-tile__title"><i v-if="icon" :class="icon"></i> {{ title }}</h3>
      <slot name="actions" />
    </div>
    <div :class="['cab-tile__body', bodyClass]">
      <slot />
    </div>
    <div v-if="$slots.footer" class="cab-tile__foot">
      <slot name="footer" />
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    icon?: string
    span?: number | string
    accent?: boolean
    bodyClass?: string
  }>(),
  { span: 12 },
)
</script>

<template>
  <div class="panel description-html">
    <h1>{{ $t('theme.noir.donate') }}</h1>
    <ThemeMarquee :text="$t('header.donate')" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })
</script>

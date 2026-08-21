<template>
  <div class="panel description-html">
    <h1>{{ $t('theme.noir.hello') }}</h1>
    <ThemeMarquee :text="$pub.sitename" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })
</script>

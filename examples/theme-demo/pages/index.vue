<template>
  <div class="panel description-html">
    <h1>{{ $t('theme.aurora.hello') }}</h1>
    <ThemeHighlight :text="$pub.sitename" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })
</script>

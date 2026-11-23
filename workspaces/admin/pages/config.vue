<template>
  <div class="settings-page">
    <header class="settings-page__header"><h1>{{ $t('settings.title') }}</h1><p>{{ $t('settings.description') }}</p></header>
    <div class="card"><SettingsPanel :editable="canUpdate" /></div>
    <details v-if="canUpdate" class="settings-page__advanced" @toggle="toggleAdvanced">
      <summary>{{ $t('settings.advanced_title') }}</summary>
      <p>{{ $t('settings.advanced_hint') }}</p>
      <AdvancedSettings v-if="advanced" />
    </details>
  </div>
</template>

<script setup lang="ts">
const { $t } = useNuxtApp()
const { canUpdate } = useAccess({ canUpdate: 'panel.config.update' })
const advanced = ref(false)
const toggleAdvanced = (event: Event) => { advanced.value = (event.target as HTMLDetailsElement).open }
useHead({ title: computed(() => $t('settings.title')) })
</script>

<style scoped>
.settings-page__header { margin-bottom: 24px; }
.settings-page__header h1 { margin: 0 0 8px; font-size: 24px; font-weight: 600; }
.settings-page__header p { margin: 0; color: var(--p-text-muted-color); }
.settings-page__advanced { margin-top: 24px; }
.settings-page__advanced summary { cursor: pointer; padding: 12px 0; color: var(--p-text-muted-color); }
.settings-page__advanced > p { color: var(--p-text-muted-color); }
</style>

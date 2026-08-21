<template>
  <div class="grid">
    <div class="col-12 md:col-6">
      <ThemePanel :title="$t('theme.graphite.hello')" :text="$t('theme.graphite.text')" />
    </div>
    <div class="col-12 md:col-6">
      <ExtensionSlot name="dashboard" />
    </div>
  </div>
</template>

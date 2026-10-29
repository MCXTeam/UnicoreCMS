<template>
  <span class="wipe-badge">{{ $t('servers.wipe') }}</span>
</template>

<style scoped>
.wipe-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  background: #b23c30;
  color: #fff;
  font-size: var(--ui-caption-size);
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 16px;
  vertical-align: middle;
  white-space: nowrap;
}
</style>

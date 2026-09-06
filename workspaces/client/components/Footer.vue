<template>
  <footer class="app-footer">
    <div class="container">
      <LayoutRenderer place="footer" />
      <div class="footer-system">
        <small class="d-flex align-items-center">
          <img class="me-1" height="16px" :src="systemLogo" />
          {{ $t('footer.powered') }} <a class="ms-1" href="https://unicorecms.ru/" target="_blank">UnicoreCMS</a>
        </small>
      </div>
      <ExtensionSlot name="footer" />
    </div>
  </footer>
</template>

<script setup lang="ts">
import systemLogo from '~/assets/images/system-logo.png'
</script>

<style scoped>
.footer-system {
  margin-top: 24px;
  opacity: 0.75;
}
</style>

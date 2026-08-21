<template>
  <footer class="app-footer">
    <div class="container">
      <div class="row">
        <div class="col-auto">
          <img height="100px" src="/icon.png" />
        </div>
        <div class="col-xl-6">
          <h3 class="mt-0 mb-1">© {{ $moment().format('YYYY') }} {{ $pub.sitename }}</h3>
          <p class="footer-desc">
            {{ $t('footer.rights') }}
            <a href="https://www.minecraft.net" target="_blank">Minecraft</a>.
          </p>
          <small class="d-flex align-items-center">
            <img class="me-1" height="16px" :src="systemLogo" />
            {{ $t('footer.powered') }} <a class="ms-1" href="https://unicorecms.ru/" target="_blank">UnicoreCMS</a>
          </small>
        </div>
        <div class="col ms-xl-4">
          <h3 class="mt-0 mb-2">{{ $t('footer.navigation') }}</h3>
          <div class="row">
            <div v-for="(column, index) in columns" :key="index" class="col links">
              <template v-for="item in column" :key="item.key">
                <a v-if="item.href" :href="item.href" target="_blank">{{ $t(item.label) }}</a>
                <NuxtLink v-else :to="item.to">{{ $t(item.label) }}</NuxtLink>
              </template>
            </div>
          </div>
        </div>
      </div>
      <ExtensionSlot name="footer" />
    </div>
  </footer>
</template>

<script setup lang="ts">
import systemLogo from '~/assets/images/system-logo.png'

const links = useNavigation('footer')

const columns = computed(() => {
  const half = Math.ceil(links.value.length / 2)

  return [links.value.slice(0, half), links.value.slice(half)]
})
</script>

<template>
  <div class="px-4 store-servers" :aria-busy="loading">
    <h2 class="mt-0 mb-4">{{ $t('store.choose_server') }}</h2>
    <div v-if="loading" class="row" role="status" :aria-label="$t('common.loading')">
      <div v-for="n in 3" :key="n" class="col-xl-6"><Skeleton height="220px" width="100%" class="mb-4" /></div>
    </div>
    <div v-else-if="failed" class="panel">
      <p>{{ $t('store.catalog_load_error') }}</p>
      <Button :label="$t('admin.retry')" icon="pi pi-refresh" @click="load" />
    </div>
    <template v-else>
      <p class="store-servers__hint">{{ $t(availableServers.length ? 'store.available_catalogs' : 'store.catalogs_empty') }}</p>
      <div class="row">
        <div class="col-xl-6 mb-4" v-for="server in availableServers" :key="server.id">
          <NuxtLink
            :to="`/store/products/${server.id}`"
            class="panel store-server without-underline"
          >
            <div class="store-server__content">
              <h2 class="m-0">{{ server.name }}</h2>
              <p>
                {{ $t('store.server_counts', { products: server.products_count, categories: server.categories_count }) }}
              </p>
              <span class="store-server__action">{{ $t('store.open_catalog') }} <i class="bx bx-right-arrow-alt" aria-hidden="true" /></span>
            </div>
            <img v-if="server.icon" :src="`${apiUrl}/${server.icon}`" alt="" class="store-server__icon" />
            <div
              class="store-server__image"
              :style="server.image ? { backgroundImage: `url('${apiUrl}/${server.image}')` } : undefined"
            />
          </NuxtLink>
        </div>
      </div>
      <details v-if="emptyServers.length" class="store-servers__empty">
        <summary>{{ $t('store.empty_catalogs', { count: emptyServers.length }) }}</summary>
        <div v-for="server in emptyServers" :key="server.id" class="store-servers__empty-row">
          <NuxtLink :to="`/store/products/${server.id}`">{{ server.name }}</NuxtLink>
          <small>{{ $t('store.catalog_empty_hint') }}</small>
        </div>
      </details>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'header.store' })

const { $t } = useNuxtApp()

const catalogApi = useStoreCatalog()

useHead({ title: computed(() => $t('header.store')) })
const apiUrl = useRuntimeConfig().public.apiBaseurl

const servers = ref<any[]>([])
const loading = ref(true)
const failed = ref(false)
const availableServers = computed(() => servers.value.filter((server) => Number(server.products_count) > 0))
const emptyServers = computed(() => servers.value.filter((server) => !(Number(server.products_count) > 0)))

async function load() {
  loading.value = true
  failed.value = false
  try {
    servers.value = await catalogApi.servers()
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<style scoped>
.store-servers__hint {
  font-size: 14px;
  color: var(--cab-muted);
  margin: 0 0 24px;
}
.store-server {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 220px;
  height: 100%;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid var(--cab-line);
  box-shadow: none;
  background: #20242c;
}
.store-server__image {
  position: absolute;
  inset: 0;
  z-index: -2;
  background-size: cover;
  background-position: center;
}
.store-server::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(0deg, rgb(0 0 0 / 90%), rgb(0 0 0 / 16%));
}
.store-server__icon {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  object-fit: contain;
}
.store-server__content {
  min-width: 0;
  padding-top: 48px;
  color: white;
}
.store-server__content h2 {
  color: white;
  font-size: 22px;
}
.store-server__content p {
  color: rgb(255 255 255 / 85%);
  font-size: 14px;
  margin: 8px 0 0;
}
.store-server__action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  font-size: 14px;
}
.store-server__action i {
  font-size: 20px;
}
.store-server:hover .store-server__action,
.store-server:focus-visible .store-server__action {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.store-servers__empty {
  border-top: 1px solid var(--cab-line);
  padding-top: 24px;
}
.store-servers__empty summary {
  cursor: pointer;
  color: var(--cab-muted);
  font-size: 14px;
}
.store-servers__empty-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--cab-line);
  overflow-wrap: anywhere;
}
.store-servers__empty-row small {
  color: var(--cab-muted);
}
@media (max-width: 700px) {
  .store-server {
    min-height: 200px;
  }
}
</style>

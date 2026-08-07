<template>
  <div class="px-4">
    <h2 class="mt-0 mb-4">{{ $t('store.choose_server') }}</h2>
    <div v-if="servers.length">
      <div class="row">
        <div class="col-xl-6 mb-4" v-for="server in servers" :key="server.id">
          <NuxtLink
            :to="`/store/products/${server.id}`"
            class="h-100 panel server-block p-5 d-flex align-items-center justify-content-between without-underline"
          >
            <div>
              <h2 class="m-0">{{ server.name }}</h2>
              <h5 class="m-0">
                {{ $t('store.server_counts', { products: server.products_count, categories: server.categories_count }) }}
              </h5>
            </div>
            <img v-if="server.icon" :src="`${apiUrl}/${server.icon}`" width="96px" />
            <div
              class="image"
              :style="'background-color: var(--vs-theme-bg);' + (server.image && `background-image: url('${apiUrl}/${server.image}')`)"
            />
          </NuxtLink>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="row">
        <div class="col-xl-6" v-for="(n, index) in 3" :key="index">
          <Skeleton height="180px" width="100%" class="mb-3"></Skeleton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'header.store' })

const { $api, $t } = useNuxtApp()

useHead({ title: computed(() => $t('header.store')) })
const apiUrl = useRuntimeConfig().public.apiBaseurl

const servers = ref<any[]>([])

onMounted(async () => {
  servers.value = await $api.get('/store/products/protected/servers').then((res) => res.data)
})
</script>

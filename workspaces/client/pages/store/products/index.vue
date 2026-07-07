<template>
  <div class="px-4">
    <h2 class="mt-0 mb-4">Выберите сервер</h2>
    <div v-if="servers.length">
      <div class="row">
        <div class="col-xl-6" v-for="server in servers" :key="server.id">
          <NuxtLink
            :to="`/store/products/${server.id}`"
            class="mb-4 panel server-block p-5 d-flex align-items-center justify-content-between without-underline"
          >
            <div>
              <h2 class="m-0">{{ server.name }}</h2>
              <h5 class="m-0">{{ server.products_count }} товаров из {{ server.categories_count }} категорий</h5>
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
definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'Магазин' })
useHead({ title: 'Магазин' })

const { $api } = useNuxtApp()
const apiUrl = useRuntimeConfig().public.apiBaseurl

const servers = ref<any[]>([])

onMounted(async () => {
  servers.value = await $api.get('/store/products/protected/servers').then((res) => res.data)
})
</script>

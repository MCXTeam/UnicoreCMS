<template>
  <div>
    <NuxtLink
      :to="`/servers/${server.id}`"
      class="mb-4 panel server-block p-5 d-flex align-items-center justify-content-between without-underline"
      v-for="server in servers"
      :key="server.id"
    >
      <div>
        <h1 class="m-0 d-flex align-items-center gap-2">
          {{ server.name }} <small v-text="server.version" />
          <WipeBadge v-if="server.wipe" />
        </h1>
        <h4 class="m-0" v-text="server.slogan" />
      </div>
      <img v-if="server.icon" :src="`${$pub.apiBaseurl}/${server.icon}`" width="96px" />
      <div class="image" :style="server.image && `background-image: url('${$pub.apiBaseurl}/${server.image}')`" />
    </NuxtLink>
    <ExtensionSlot name="servers.list" :servers="servers" />
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'landing' })

const { $pub, $t } = useNuxtApp()
const ui = useUiStore()

const { data: servers } = await useServers().list()

useHead({ title: computed(() => $t('header.servers')) })
ui.setName($t('servers.page_name', { sitename: $pub.sitename }))
</script>

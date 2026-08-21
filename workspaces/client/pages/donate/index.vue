<template>
  <section>
    <div v-if="servers && servers.length">
      <NuxtLink
        :to="`/donate/${server.id}`"
        class="mb-4 panel server-block p-5 d-flex align-items-center justify-content-between without-underline"
        v-for="server in servers"
        :key="server.id"
      >
        <div>
          <h1 class="m-0">{{ server.name }} <small v-text="server.version" /></h1>
          <h4 class="m-0" v-text="server.slogan" />
        </div>
        <img v-if="server.icon" :src="`${$pub.apiBaseurl}/${server.icon}`" width="96px" />
        <div class="image" :style="server.image && `background-image: url('${$pub.apiBaseurl}/${server.image}')`" />
      </NuxtLink>
    </div>
    <div v-else>
      <Skeleton v-for="(n, index) in 3" :key="index" height="180px" width="100%" class="mb-3"></Skeleton>
    </div>
  </section>
    <ExtensionSlot name="donate.index" />
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'landing' })

const { $pub, $t } = useNuxtApp()

useHead({ title: computed(() => $t('header.donate')) })
useUiStore().setName($t('donate.page_name', { sitename: $pub.sitename }))

const { data: servers } = await useServers().list('donate-servers')
</script>

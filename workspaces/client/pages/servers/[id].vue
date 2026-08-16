<template>
  <div>
    <div class="mb-4 panel">
      <div class="panel server-block p-5 d-flex align-items-center justify-content-between">
        <div>
          <h1 class="m-0">{{ server.name }}</h1>
          <h4 class="m-0" v-text="server.slogan" />
        </div>
        <img v-if="server.icon" :src="`${$pub.apiBaseurl}/${server.icon}`" width="96px" />
        <div class="image" :style="server.image && `background-image: url('${$pub.apiBaseurl}/${server.image}')`" />
      </div>
      <div class="row">
        <div class="col-xl-7 pe-xl-5" v-if="server.content">
          <h2 class="mt-4 mb-2">{{ $t('servers.description') }}</h2>
          <div class="description-html" v-html="$sanitize(server.content)" />
        </div>
        <div class="col-xl-5">
          <h3 class="mt-4 mb-2">{{ $t('servers.info') }}</h3>
          <table class="server-table w-100">
            <tr>
              <td>{{ $t('servers.game_version') }}</td>
              <td v-text="server.version" />
            </tr>
            <tr v-for="(row, i) in server.table" :key="i">
              <td v-text="row.title" />
              <td v-text="row.description" />
            </tr>
          </table>
        </div>
      </div>
    </div>
    <div class="mb-4 panel" v-if="gallery && gallery.length">
      <h2 class="mt-0 mb-3">{{ $t('servers.gallery') }}</h2>
      <Galleria
        :value="gallery"
        :numVisible="4"
        :circular="true"
        :showItemNavigators="true"
        :showThumbnails="gallery.length > 1"
        containerStyle="max-width: 100%"
      >
        <template #item="slotProps">
          <img :src="`${$pub.apiBaseurl}/${slotProps.item.file}`" :alt="slotProps.item.title || server.name" class="w-100" />
        </template>
        <template #thumbnail="slotProps">
          <img :src="`${$pub.apiBaseurl}/${slotProps.item.file}`" :alt="slotProps.item.title || server.name" width="80" />
        </template>
      </Galleria>
    </div>
    <div v-if="server.mods && server.mods.length">
      <h2 class="mt-5 mb-4">{{ $t('servers.mods') }}</h2>
      <div v-for="mod in server.mods" :key="mod.id" class="mb-4 panel" v-show="mod.description">
        <div class="row">
          <div class="col-xl-10">
            <h2 v-text="mod.name" class="mt-0 mb-2" />
            <div v-if="mod.description" v-html="$sanitize(mod.description)"></div>
          </div>
          <div class="col-2 d-none d-md-flex justify-content-end align-items-start">
            <img v-if="mod.icon" :src="`${$pub.apiBaseurl}/${mod.icon}`" width="80px" />
          </div>
        </div>
      </div>
    </div>
    <div class="mb-4 panel" v-if="othermods">
      <h2 class="mt-0 mb-2">{{ $t('servers.other_mods') }}</h2>
      <div v-text="othermods"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'landing' })

const route = useRoute()
const { $api, $t } = useNuxtApp()
const ui = useUiStore()

const { data: server, error } = await useAsyncData<any>(`server-${route.params.id}`, () =>
  $api.get(`/servers/${route.params.id}`).then((res) => res.data),
)

if (error.value || !server.value) {
  throw createError({ statusCode: 404, fatal: true })
}

const { data: gallery } = await useAsyncData<any[]>(`server-gallery-${route.params.id}`, () =>
  $api.get(`/servers/${route.params.id}/gallery`).then((res) => res.data),
  { default: () => [] },
)

const othermods = server.value?.mods
  ?.filter((m: any) => !m.description)
  ?.map((m: any) => m.name)
  ?.join(', ')

ui.setName($t('servers.about', { server: server.value.name }))

useHead({
  title: server.value?.name,
  meta: [{ name: 'description', content: server.value?.description }],
})
</script>

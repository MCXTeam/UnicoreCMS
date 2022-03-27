<template>
    <div>
      <div class="mb-4 panel">
        <div class="panel server-block p-5 d-flex align-items-center justify-content-between">
          <div>
            <h1 class="m-0">{{ server.name }}</h1>
            <h4 class="m-0" v-text="server.slogan" />
          </div>
          <img v-if="server.icon" :src="`${$config.apiUrl}/${server.icon}`" width="96px" />
          <div class="image" :style="server.image && `background-image: url('${$config.apiUrl}/${server.image}')`" />
        </div>
        <div class="row">
          <div class="col-xl-7 pe-xl-5" v-if="server.content">
            <h2 class="mt-4 mb-2">Описание сервера</h2>
            <div class="description-html" v-html="server.content" />
          </div>
          <div class="col-5">
            <h3 class="mt-4 mb-2">Информация о сервере</h3>
            <table class="server-table w-100">
              <tr>
                <td>Игровая версия</td>
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
      <div v-if="server.mods && server.mods.length">
        <h2 class="mt-5 mb-4">Моды сервера</h2>
        <div v-for="mod in server.mods" :key="mod.id" class="mb-4 panel" v-show="mod.description">
          <div class="row">
            <div class="col-xl-10">
              <h2 v-text="mod.name" class="mt-0 mb-2" />
              <div v-if="mod.description" v-html="mod.description"></div>
            </div>
            <div class="col-2 d-none d-md-flex justify-content-end align-items-start">
              <img v-if="mod.icon" :src="`${$config.apiUrl}/${mod.icon}`" width="80px" />
            </div>
          </div>
        </div>
      </div>
      <div class="mb-4 panel" v-if="othermods">
        <h2 class="mt-0 mb-2">Остальные моды</h2>
        <div v-text="othermods"></div>
      </div>
    </div>
</template>

<script>
export default {
  layout: 'landing',

  head() {
    return {
      title: this?.server?.name,
      description: this?.server?.description,
    }
  },

  async asyncData({ $axios, error, route, store }) {
    try {
      const server = await $axios.get(`/servers/${route.params.id}`).then((res) => res.data)
      const othermods = server?.mods
        ?.filter((m) => !m.description)
        ?.map((m) => m.name)
        ?.join(', ')
      store.commit('unicore/SET_NAME', `Информация о сервере ${server.name}`)

      return { server, othermods }
    } catch {
      error({ statusCode: 404 })
    }
  },
}
</script>

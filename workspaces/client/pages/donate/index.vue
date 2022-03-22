<template>
  <section>
    <div v-if="servers.length">
      <nuxt-link
        :to="`/donate/${server.id}`"
        class="mb-4 panel server-block p-5 d-flex align-items-center justify-content-between without-underline"
        v-for="server in servers"
        :key="server.id"
      >
        <div>
          <h1 class="m-0">{{ server.name }} <small v-text="server.version" /></h1>
          <h4 class="m-0" v-text="server.slogan" />
        </div>
        <img v-if="server.icon" :src="`${$config.apiUrl}/${server.icon}`" width="96px" />
        <div class="image" :style="server.image && `background-image: url('${$config.apiUrl}/${server.image}')`" />
      </nuxt-link>
    </div>
    <div v-else>
      <Skeleton v-for="(n, index) in 3" :key="index" height="180px" width="100%" class="mb-3"></Skeleton>
    </div>
  </section>
</template>

<script>
export default {
  layout: 'landing',
  data() {
    return {
      servers: [],
    }
  },
  async fetch() {
    this.servers = await this.$axios.get('/servers').then((res) => res.data)
  },
}
</script>

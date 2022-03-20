<template>
  <div class="px-4">
    <div class="d-flex justify-content-between">
      <h2 class="mt-0 mb-4">Склад покупок</h2>
      <vs-select
        :loading="!servers.length"
        :key="servers.length"
        placeholder="Выберите сервер"
        v-model="server_id"
        style="max-width: 150px"
      >
        <vs-option v-for="(server, index) in servers" :key="server.id" :label="server.name" :value="String(index)" v-text="server.name" />
      </vs-select>
    </div>

    <div class="store-table-overflow position-relative" ref="cart">
      <table class="store-table" v-if="warehouse.length">
        <tr :key="whItem.id" v-for="whItem in warehouse">
          <td class="d-flex align-items-center">
            <Avatar v-if="whItem.product.icon" size="large" :image="`${$config.apiUrl}/${whItem.product.icon}`"> </Avatar>
            <Avatar v-else size="large"> <i class="bx bxs-image"></i> </Avatar>
            <div class="ms-3">
              <h4 class="m-0">{{ whItem.product.name }} <small class="sale-wrapper ms-2">#{{ whItem.id }}</small></h4>
              <span v-text="whItem.product.categories.map((c) => c.name).join(', ')" />
            </div>
          </td>
          <td align="right">
            <small v-text="$moment(whItem.created).local().format('DD.MM.YYYY, HH.mm')" />
            <h4 class="m-0">{{ whItem.amount }} шт.</h4>
          </td>
        </tr>
      </table>
      <h4 class="text-center m-0" v-else>Ваш склад пуст...</h4>
    </div>
  </div>
</template>

<script>
import WarehouseSidebar from '~/components/WarehouseSidebar.vue'

export default {
  layout: 'cabinet',
  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Склад')
  },
  data() {
    return {
      server_id: '0',
      warehouse: [],
      servers: [],
    }
  },

  async fetch() {
    this.servers = await this.$axios.get('/store/products/protected/servers').then((res) => res.data)
    if (this.servers.length) this.warehouseFind()
  },

  mounted() {
    this.$nuxt.$emit('setStoreSidebar', { component: WarehouseSidebar })
  },

  beforeDestroy() {
    this.$nuxt.$emit('setStoreSidebar', null)
  },

  methods: {
    async warehouseFind() {
      const loading = this.$vs.loading({ target: this.$refs.warehouse, type: 'points' })
      try {
        this.warehouse = await this.$axios.get('/store/warehouse/' + this.servers[Number(this.server_id)].id).then((res) => res.data)
      } catch {}
      loading.close()
    },
  },

  watch: {
    server_id: {
      handler: async function (val) {
        await this.warehouseFind()
      },
    },
  },
}
</script>

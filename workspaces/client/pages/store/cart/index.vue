<template>
  <div class="px-4">
    <div class="d-flex justify-content-between">
      <h2 class="mt-0 mb-4">Корзина покупок</h2>
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
      <table class="store-table" v-if="cart.length">
        <tr :key="cartItem.id" v-for="cartItem in cart">
          <td class="d-flex align-items-center">
            <Avatar v-if="cartItem.product.icon" size="large" :image="`${$config.apiUrl}/${cartItem.product.icon}`"> </Avatar>
            <Avatar v-else size="large"> <i class="bx bxs-image"></i> </Avatar>
            <div class="ms-3">
              <h4 class="m-0">
                {{ cartItem.product.name }}
                <small class="sale-wrapper ms-2" v-if="cartItem.product.sale">-{{ cartItem.product.sale }}%</small>
              </h4>
              <span v-text="cartItem.product.categories.map((c) => c.name).join(', ')" />
            </div>
          </td>
          <td>
            <strike
              v-if="cartItem.product.sale"
              v-text="$utils.formatCurrency(cartItem.product.price * cartItem.amount)"
              class="me-1"
            ></strike>
            <span v-text="$utils.formatCurrency(cartItem.product.price * cartItem.amount, cartItem.product.sale)"></span>
            <h5 class="m-0">{{ cartItem.amount }} шт.</h5>
          </td>
          <td align="right">
            <vs-button :ref="`cartItem-${cartItem.id}`" :loading="false" @click="cartDelete(cartItem.id)" danger
              ><i class="bx bx-trash"></i
            ></vs-button>
          </td>
        </tr>
      </table>
      <h4 class="text-center m-0" v-else>Ваша корзина пуста...</h4>
    </div>
  </div>
</template>

<script>
import CartSidebar from '~/components/CartSidebar.vue'

export default {
  layout: 'cabinet',
  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Корзина')
  },
  data() {
    return {
      server_id: '0',
      cart: [],
      servers: [],
    }
  },

  async fetch() {
    this.servers = await this.$axios.get('/store/products/protected/servers').then((res) => res.data)
    if (this.servers.length) this.cartFind()
  },

  mounted() {
    this.$nuxt.$emit('setStoreSidebar', { component: CartSidebar })
    this.$nuxt.$on('storeCartClear', this.cartClear)
    this.$nuxt.$on('storeCartBuy', this.cartBuy)
  },

  beforeDestroy() {
    this.$nuxt.$off('storeCartClear')
    this.$nuxt.$off('storeCartBuy')
    this.$nuxt.$emit('setStoreSidebar', null)
  },

  methods: {
    async cartFind() {
      const loading = this.$vs.loading({ target: this.$refs.cart, type: 'points' })
      try {
        this.cart = await this.$axios.get('/store/cart/' + this.servers[Number(this.server_id)].id).then((res) => res.data)
        this.$nuxt.$emit('storeCartUpdate', this.cart)
      } catch {}
      loading.close()
    },

    async cartDelete(id) {
      this.$nuxt.$emit('setStoreSidebarLoadingState', true)
      this.$refs['cartItem-' + id][0].loading = true
      await this.$axios.delete('/store/cart/item/' + id)
      await this.cartFind()
      this.$nuxt.$emit('setStoreSidebarLoadingState', false)
    },

    async cartClear() {
      const loading = this.$vs.loading({ target: this.$refs.cart, type: 'points' })
      this.$nuxt.$emit('setStoreSidebarLoadingState', true)
      try {
        await this.$axios.delete('/store/cart/server/' + this.servers[Number(this.server_id)].id)
        await this.cartFind()
      } catch {}
      loading.close()
      this.$nuxt.$emit('setStoreSidebarLoadingState', false)
    },

    async cartBuy() {
      const loading = this.$vs.loading({ target: this.$refs.cart, type: 'points' })
      this.$nuxt.$emit('setStoreSidebarLoadingState', true)
      try {
        await this.$axios.post('/store/cart/buy/' + this.servers[Number(this.server_id)].id)
        await Promise.all([this.$auth.fetchUser(), this.cartFind()])
        this.$nuxt.$emit('storeCartUpdate', this.cart)
        this.$unicore.successNotification('Покупка была совершенна')
      } catch {
        this.$unicore.errorNotification('На балансе недостаточно средств для совершения данной покупки')
      }
      loading.close()
      this.$nuxt.$emit('setStoreSidebarLoadingState', false)
    },
  },

  watch: {
    server_id: {
      handler: async function (val) {
        await this.cartFind()
        this.$nuxt.$emit('storeCartUpdate', this.cart)
      },
    },
  },
}
</script>

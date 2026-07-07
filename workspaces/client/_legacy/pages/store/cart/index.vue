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
      <table class="store-table" v-if="cart.items.length">
        <tr :key="cartItem.id" v-for="cartItem in cart.items.filter((ci) => ci.type == 'kit')">
          <td class="d-flex align-items-center">
            <Avatar v-if="cartItem.payload.kit.icon" size="large" :image="`${$config.apiUrl}/${cartItem.payload.kit.icon}`"> </Avatar>
            <Avatar v-else size="large"> <i class="bx bxs-image"></i> </Avatar>
            <div class="ms-3">
              <h4 class="m-0">
                {{ cartItem.payload.kit.name }} <small class="sale-wrapper ms-2">Набор</small>
                <small class="sale-wrapper ms-2" v-if="cartItem.payload.kit.sale">-{{ cartItem.payload.kit.sale }}%</small>
              </h4>
              <span v-text="cartItem.payload.kit.categories.map((c) => c.name).join(', ')" />
            </div>
          </td>
          <td>
            <strike v-if="cartItem.payload.kit.sale" v-text="$utils.formatCurrency('real', cartItem.payload.kit.price)" class="me-1"></strike>
            <span v-text="$utils.formatCurrency('real', cartItem.payload.kit.price, cartItem.payload.kit.sale)"></span>
            <h5 class="m-0">1 шт.</h5>
          </td>
          <td align="right">
            <vs-button :ref="`cartItem-${cartItem.type}-${cartItem.payload.id}`" :loading="false" @click="cartDelete(cartItem)" danger
              ><i class="bx bx-trash"></i
            ></vs-button>
          </td>
        </tr>
        <tr :key="cartItem.id" v-for="cartItem in cart.items.filter((ci) => ci.type == 'product')">
          <td class="d-flex align-items-center">
            <Avatar v-if="cartItem.payload.product.icon" size="large" :image="`${$config.apiUrl}/${cartItem.payload.product.icon}`">
            </Avatar>
            <Avatar v-else size="large"> <i class="bx bxs-image"></i> </Avatar>
            <div class="ms-3">
              <h4 class="m-0">
                {{ cartItem.payload.product.name }}
                <small class="sale-wrapper ms-2" v-if="cartItem.payload.product.sale">-{{ cartItem.payload.product.sale }}%</small>
              </h4>
              <span v-text="cartItem.payload.product.categories.map((c) => c.name).join(', ')" />
            </div>
          </td>
          <td>
            <strike
              v-if="cartItem.payload.product.sale"
              v-text="$utils.formatCurrency('real', cartItem.payload.product.price * cartItem.payload.amount)"
              class="me-1"
            ></strike>
            <span
              v-text="$utils.formatCurrency('real', cartItem.payload.product.price * cartItem.payload.amount, cartItem.payload.product.sale)"
            ></span>
            <h5 class="m-0">{{ cartItem.payload.amount }} шт.</h5>
          </td>
          <td align="right">
            <vs-button :ref="`cartItem-${cartItem.type}-${cartItem.payload.id}`" :loading="false" @click="cartDelete(cartItem)" danger
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
  head: {
    title: 'Корзина',
  },
  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Корзина')
  },
  data() {
    return {
      server_id: '0',
      cart: {
        items: [],
        price: 0,
        virtual_sale: 0
      },
      servers: [],
      use_virtual: false
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
    this.$nuxt.$on('storeCartUseVirtualUpdate', (val) => {
      this.use_virtual = val
    })
  },

  beforeDestroy() {
    this.$nuxt.$off('storeCartClear')
    this.$nuxt.$off('storeCartBuy')
    this.$nuxt.$off('storeCartUseVirtualUpdate')
    this.$nuxt.$emit('setStoreSidebar', null)
  },

  methods: {
    async cartFind() {
      const loading = this.$vs.loading({ target: this.$refs.cart })
      try {
        this.cart = await this.$axios.get('/store/cart/' + this.servers[Number(this.server_id)].id).then((res) => res.data)
        this.$nuxt.$emit('storeCartUpdate', this.cart)
      } catch {}
      loading.close()
    },

    async cartDelete(item) {
      this.$nuxt.$emit('setStoreSidebarLoadingState', true)
      this.$refs[`cartItem-${item.type}-${item.payload.id}`][0].loading = true
      await this.$axios.delete(`/store/cart/item/${item.type}/${item.payload.id}`)
      await this.cartFind()
      this.$nuxt.$emit('setStoreSidebarLoadingState', false)
    },

    async cartClear() {
      const loading = this.$vs.loading({ target: this.$refs.cart })
      this.$nuxt.$emit('setStoreSidebarLoadingState', true)
      try {
        await this.$axios.delete('/store/cart/server/' + this.servers[Number(this.server_id)].id)
        await this.cartFind()
      } catch {}
      loading.close()
      this.$nuxt.$emit('setStoreSidebarLoadingState', false)
    },

    async cartBuy() {
      const loading = this.$vs.loading({ target: this.$refs.cart })
      this.$nuxt.$emit('setStoreSidebarLoadingState', true)
      try {
        await this.$axios.post('/store/cart/buy', {
          server_id: this.servers[Number(this.server_id)].id,
          use_virtual: this.use_virtual
        })
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

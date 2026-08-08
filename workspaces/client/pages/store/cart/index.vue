<template>
  <div class="px-4">
    <div class="d-flex justify-content-between">
      <h2 class="mt-0 mb-4">{{ $t('store.cart_title') }}</h2>
      <Select
        :loading="!servers.length"
        :key="servers.length"
        :placeholder="$t('store.choose_server')"
        v-model="server_id"
        :options="serverOptions"
        optionLabel="label"
        optionValue="value"
        style="max-width: 150px"
      />
    </div>

    <div class="store-table-overflow position-relative">
      <table class="store-table" v-if="cart.items.length">
        <tr :key="cartItem.id" v-for="cartItem in cart.items.filter((ci) => ci.type == 'kit')">
          <td class="d-flex align-items-center">
            <IconAvatar :path="cartItem.payload.kit.icon" size="large" />
            <div class="ms-3">
              <h4 class="m-0">
                {{ cartItem.payload.kit.name }} <small class="sale-wrapper ms-2">{{ $t('store.kit') }}</small>
                <small class="sale-wrapper ms-2" v-if="cartItem.payload.kit.sale">-{{ cartItem.payload.kit.sale }}%</small>
              </h4>
              <span v-text="cartItem.payload.kit.categories.map((c) => c.name).join(', ')" />
            </div>
          </td>
          <td>
            <strike
              v-if="cartItem.payload.kit.sale"
              v-text="$utils.formatCurrency('real', cartItem.payload.kit.price)"
              class="me-1"
            ></strike>
            <span v-text="$utils.formatCurrency('real', cartItem.payload.kit.price, cartItem.payload.kit.sale)"></span>
            <h5 class="m-0">{{ $t('store.pieces', { amount: 1 }) }}</h5>
          </td>
          <td align="right">
            <Button :loading="deletingKey == `${cartItem.type}-${cartItem.payload.id}`" @click="cartDelete(cartItem)" severity="danger"
              ><i class="bx bx-trash"></i
            ></Button>
          </td>
        </tr>
        <tr :key="cartItem.id" v-for="cartItem in cart.items.filter((ci) => ci.type == 'product')">
          <td class="d-flex align-items-center">
            <IconAvatar :path="cartItem.payload.product.icon" size="large" />
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
              v-text="
                $utils.formatCurrency('real', cartItem.payload.product.price * cartItem.payload.amount, cartItem.payload.product.sale)
              "
            ></span>
            <h5 class="m-0">{{ $t('store.pieces', { amount: cartItem.payload.amount }) }}</h5>
          </td>
          <td align="right">
            <Button :loading="deletingKey == `${cartItem.type}-${cartItem.payload.id}`" @click="cartDelete(cartItem)" severity="danger"
              ><i class="bx bx-trash"></i
            ></Button>
          </td>
        </tr>
      </table>
      <h4 class="text-center m-0" v-else>{{ $t('store.cart_empty') }}</h4>
    </div>
  </div>
</template>

<script>
import { useEventBus } from '@vueuse/core'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'verify'],
  title: 'store.tab_cart',
})

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('store.tab_cart')) })

    return {
      ui: useUiStore(),
      cartUpdateBus: useEventBus('storeCartUpdate'),
      cartClearBus: useEventBus('storeCartClear'),
      cartBuyBus: useEventBus('storeCartBuy'),
      cartUseVirtualBus: useEventBus('storeCartUseVirtualUpdate'),
    }
  },

  data() {
    return {
      server_id: '0',
      deletingKey: null,
      cart: {
        items: [],
        price: 0,
        virtual_sale: 0,
      },
      servers: [],
      use_virtual: false,
    }
  },

  computed: {
    serverOptions() {
      return this.servers.map((server, index) => ({ label: server.name, value: String(index) }))
    },
  },

  async mounted() {
    await this.load()
    this.ui.setStoreSidebar({ component: 'CartSidebar', payload: { cart: this.cart, loading: false } })
    this.offClear = this.cartClearBus.on(this.cartClear)
    this.offBuy = this.cartBuyBus.on(this.cartBuy)
    this.offUseVirtual = this.cartUseVirtualBus.on((val) => {
      this.use_virtual = val
    })
  },

  beforeUnmount() {
    this.offClear?.()
    this.offBuy?.()
    this.offUseVirtual?.()
    this.ui.setStoreSidebar(null)
  },

  methods: {
    async load() {
      this.servers = await this.$api.get('/store/products/protected/servers').then((res) => res.data)

      if (!this.servers.length) return

      const filled = await this.$api.get('/store/cart/servers').then((res) => res.data)
      const index = this.servers.findIndex((server) => filled.includes(server.id))
      const target = String(index === -1 ? 0 : index)

      if (target === this.server_id) await this.cartFind()
      else this.server_id = target
    },

    async cartFind() {
      const loading = this.$unicore.loading()
      try {
        this.cart = await this.$api.get('/store/cart/' + this.servers[Number(this.server_id)].id).then((res) => res.data)
        this.cartUpdateBus.emit(this.cart)
      } catch {}
      loading.close()
    },

    async cartDelete(item) {
      this.ui.setStoreSidebarLoading(true)
      this.deletingKey = `${item.type}-${item.payload.id}`
      await this.$api.delete(`/store/cart/item/${item.type}/${item.payload.id}`)
      await this.cartFind()
      this.deletingKey = null
      this.ui.setStoreSidebarLoading(false)
    },

    async cartClear() {
      const loading = this.$unicore.loading()
      this.ui.setStoreSidebarLoading(true)
      try {
        await this.$api.delete('/store/cart/server/' + this.servers[Number(this.server_id)].id)
        await this.cartFind()
      } catch {}
      loading.close()
      this.ui.setStoreSidebarLoading(false)
    },

    async cartBuy() {
      const loading = this.$unicore.loading()
      this.ui.setStoreSidebarLoading(true)
      try {
        await this.$api.post('/store/cart/buy', {
          server_id: this.servers[Number(this.server_id)].id,
          use_virtual: this.use_virtual,
        })
        await Promise.all([this.$auth.fetchUser(), this.cartFind()])
        this.cartUpdateBus.emit(this.cart)
        this.$unicore.successNotification(this.$t('store.purchase_done'))
      } catch {
        this.$unicore.errorNotification(this.$t('store.not_enough_money'))
      }
      loading.close()
      this.ui.setStoreSidebarLoading(false)
    },
  },

  watch: {
    server_id: {
      handler: async function () {
        await this.cartFind()
        this.cartUpdateBus.emit(this.cart)
      },
    },
  },
}
</script>

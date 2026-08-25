<template>
  <div class="cab-grid">
    <CabTile :title="$t('store.cart_title')" icon="bx bx-cart-alt" :span="12">
      <template #actions>
        <Select
          class="cab-select"
          :loading="!servers.length"
          :key="servers.length"
          :placeholder="$t('store.choose_server')"
          v-model="server_id"
          :options="serverOptions"
          optionLabel="label"
          optionValue="value"
        />
      </template>

      <div v-if="cart.items.length" class="cab-offers">
        <div v-for="cartItem in cartKits" :key="`kit-${cartItem.payload.id}`" class="cab-offer">
          <IconAvatar :path="cartItem.payload.kit.icon" size="large" />
          <div class="cab-offer__text">
            <div class="cab-offer__name">
              <h4 v-text="cartItem.payload.kit.name" />
              <span class="cab-badge">{{ $t('store.kit') }}</span>
              <span v-if="cartItem.payload.kit.sale" class="cab-badge">-{{ cartItem.payload.kit.sale }}%</span>
            </div>
            <div class="cab-offer__price">
              <strike v-if="cartItem.payload.kit.sale" v-text="$utils.formatCurrency('real', cartItem.payload.kit.price)" />
              <b>{{ $utils.formatCurrency('real', cartItem.payload.kit.price, cartItem.payload.kit.sale) }}</b>
              <span>{{ $t('store.pieces', { amount: 1 }) }}</span>
            </div>
          </div>
          <Button
            v-tooltip.left="$t('common.delete')"
            severity="danger"
            text
            :loading="deletingKey == `${cartItem.type}-${cartItem.payload.id}`"
            @click="cartDelete(cartItem)"
          >
            <i class="bx bx-trash"></i>
          </Button>
        </div>

        <div v-for="cartItem in cartProducts" :key="`product-${cartItem.payload.id}`" class="cab-offer">
          <IconAvatar :path="cartItem.payload.product.icon" size="large" />
          <div class="cab-offer__text">
            <div class="cab-offer__name">
              <h4 v-text="cartItem.payload.product.name" />
              <span v-if="cartItem.payload.product.sale" class="cab-badge">-{{ cartItem.payload.product.sale }}%</span>
            </div>
            <div class="cab-offer__price">
              <strike
                v-if="cartItem.payload.product.sale"
                v-text="$utils.formatCurrency('real', cartItem.payload.product.price * cartItem.payload.amount)"
              />
              <b>
                {{ $utils.formatCurrency('real', cartItem.payload.product.price * cartItem.payload.amount, cartItem.payload.product.sale) }}
              </b>
              <span>{{ $t('store.pieces', { amount: cartItem.payload.amount }) }}</span>
            </div>
          </div>
          <Button
            v-tooltip.left="$t('common.delete')"
            severity="danger"
            text
            :loading="deletingKey == `${cartItem.type}-${cartItem.payload.id}`"
            @click="cartDelete(cartItem)"
          >
            <i class="bx bx-trash"></i>
          </Button>
        </div>
      </div>
      <div v-else class="cab-empty">
        <i class="bx bx-cart"></i>
        <span>{{ $t('store.cart_empty') }}</span>
      </div>
    </CabTile>
  </div>
</template>

<script>
import { useEventBus } from '@vueuse/core'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'verify'],
  title: 'store.tab_cart',
  hint: 'store.cart_hint',
})

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('store.tab_cart')) })

    return {
      cartApi: useCart(),
      catalogApi: useStoreCatalog(),
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
    cartKits() {
      return this.cart.items.filter((item) => item.type == 'kit')
    },
    cartProducts() {
      return this.cart.items.filter((item) => item.type == 'product')
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
      this.servers = await this.catalogApi.servers()

      if (!this.servers.length) return

      const filled = await this.cartApi.servers()
      const index = this.servers.findIndex((server) => filled.includes(server.id))
      const target = String(index === -1 ? 0 : index)

      if (target === this.server_id) await this.cartFind()
      else this.server_id = target
    },

    async cartFind() {
      const loading = this.$unicore.loading()
      try {
        this.cart = await this.cartApi.load(this.servers[Number(this.server_id)].id)
        this.cartUpdateBus.emit(this.cart)
      } catch {}
      loading.close()
    },

    async cartDelete(item) {
      this.ui.setStoreSidebarLoading(true)
      this.deletingKey = `${item.type}-${item.payload.id}`
      await this.cartApi.remove(item.type, item.payload.id)
      await this.cartFind()
      this.deletingKey = null
      this.ui.setStoreSidebarLoading(false)
    },

    async cartClear() {
      const loading = this.$unicore.loading()
      this.ui.setStoreSidebarLoading(true)
      try {
        await this.cartApi.clear(this.servers[Number(this.server_id)].id)
        await this.cartFind()
      } catch {}
      loading.close()
      this.ui.setStoreSidebarLoading(false)
    },

    async cartBuy() {
      const loading = this.$unicore.loading()
      this.ui.setStoreSidebarLoading(true)
      try {
        await this.cartApi.buy({
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

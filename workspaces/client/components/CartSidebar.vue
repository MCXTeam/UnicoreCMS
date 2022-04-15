<template>
  <div class="panel px-4 py-3 mb-4">
    <h3 class="text-uppercase m-0">Оплата</h3>
    <div v-if="cart.virtual_sale > 0" class="d-flex justify-content-between align-items-center mt-2">
      <vs-checkbox v-model="use_virtual"> Использовать бонусы </vs-checkbox>
      <b>-{{ $utils.formatCurrency(cart.virtual_sale) }}</b>
    </div>
    <div class="d-flex justify-content-between mt-2">
      <span>Итого к оплате:</span>
      <b v-if="!use_virtual" v-text="$utils.formatCurrency(cart.price)" />
      <div v-else>
        <small><strike v-text="$utils.formatCurrency(cart.price)" /></small>
        <b v-text="$utils.formatCurrency(cart.price - cart.virtual_sale)" />
      </div>
    </div>
    <div v-if="cart.items.length" class="d-flex justify-content-between mt-2">
      <vs-button @click="$nuxt.$emit('storeCartBuy')" :disabled="loading" block size="large">Оплатить</vs-button>
      <vs-button @click="$nuxt.$emit('storeCartClear')" :disabled="loading" danger block size="large">Очистить</vs-button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    cart: {
      type: Object,
      default: {
        items: [],
        price: 0,
        virtual_sale: 0,
      },
    },
  },

  data() {
    return {
      use_virtual: false,
    }
  },

  mounted() {
    this.$nuxt.$on('storeCartUpdate', async (payload) => {
      this.cart = payload
    })
  },

  beforeDestroy() {
    this.$nuxt.$off('storeCartUpdate')
  },

  watch: {
    use_virtual: {
      handler: function (val) {
        this.$nuxt.$emit('storeCartUseVirtualUpdate', val)
      },
    },
  },
}
</script>

<template>
  <div class="panel px-4 py-3 mb-4">
    <h3 class="text-uppercase m-0">Оплата</h3>
    <div class="d-flex justify-content-between mt-2">
      <span>Стоимость товаров</span>
      <b v-text="$utils.formatCurrency(price)" />
    </div>
    <div v-if="cart.length" class="d-flex justify-content-between mt-3">
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
      type: Array,
      default: [],
    },
  },

  data() {
    return {
      price: 0,
    }
  },

  mounted() {
    this.calculate()
    this.$nuxt.$on('storeCartUpdate', async (payload) => {
      this.cart = payload
      this.calculate()
    })
  },

  beforeDestroy() {
    this.$nuxt.$off('storeCartUpdate')
  },

  methods: {
    calculate() {
      this.price = this.$_.sum(
        this.cart.map((ci) => {
          if (ci.type == 'product')
            return (ci.payload.product.price - (ci.payload.product.price * ci.payload.product.sale) / 100) * ci.payload.amount
          else return ci.payload.kit.price - (ci.payload.kit.price * ci.payload.kit.sale) / 100
        })
      )
    },
  },
}
</script>

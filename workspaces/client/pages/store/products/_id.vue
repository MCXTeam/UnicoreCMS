<template>
  <section class="px-4">
    <ValidationObserver v-slot="{ invalid }">
      <vs-dialog class="buy-dialog" v-model="productDialog" v-if="product" :loading="loading" :prevent-close="loading" :not-close="loading">
        <template #header>
          <div class="d-flex flex-column align-items-center">
            <h4 class="mt-2 mb-0">Сервер: {{ server.name }}</h4>
            <h3 class="mt-0" v-if="product.type == 'product'" v-text="product.payload.name" />
            <h3 class="mt-0" v-else>Набор: {{ product.payload.name }}</h3>
            <Avatar v-if="product.payload.icon" size="xlarge" :image="`${$config.apiUrl}/${product.payload.icon}`"> </Avatar>
            <Avatar v-else size="xlarge"> <i class="bx bxs-image"></i> </Avatar>
          </div>
        </template>
        <div class="description-html mb-3" v-if="product.payload.description" v-html="product.payload.description" />
        <div v-if="product.type == 'product'" class="mb-4">
          <h5 class="text-uppercase my-2">Количество ({{ amount }} шт.)</h5>
          <Slider
            v-model="amount"
            @change="multiple_of_fix"
            :min="product.payload.multiple_of || 1"
            :max="amount < 10000 ? amount + (product.payload.multiple_of || 1) * 10 : 10000 - (10000 % (product.payload.multiple_of || 1))"
            :step="product.payload.multiple_of || 1"
          />
        </div>
        <div v-else>
          <h3 class="mt-0 text-center">Содержимое набора</h3>
          <div v-if="product.payload.items">
            <div class="d-flex mb-1" v-for="item in product.payload.items" :key="item.product.id">
              <Avatar v-if="item.product.icon" :image="`${$config.apiUrl}/${item.product.icon}`"> </Avatar>
              <Avatar v-else> <i class="bx bxs-image"></i> </Avatar>
              <h4 class="ms-2 my-0">{{ item.product.name }} x{{ item.amount }}</h4>
            </div>
          </div>
        </div>
        <vs-alert
          v-if="
            product.payload.virtual_percent != 0 &&
            ((config.public_store_products_virtual_use && product.type == 'product') ||
              (config.public_store_kits_virtual_use && product.type == 'kit'))
          "
          relief
          class="mt-3"
        >
          <template #icon>
            <i class="bx bxs-gift"></i>
          </template>
          Вы можете оплатить <b>{{ product.payload.virtual_percent || config.public_virtual_percent }}%</b> от стоимости товара бонусами
        </vs-alert>
        <template #footer>
          <div v-if="!invalid" class="d-flex justify-content-center">
            <vs-button v-if="product.type == 'product'" size="large" transparent @click="addToCart()">
              Добавить в корзину ({{
                $utils.formatCurrency('real', product.payload.price * amount, product.payload.sale)
              }})</vs-button
            >
            <vs-button v-else size="large" transparent @click="addToCart()">
              Добавить в корзину ({{ $utils.formatCurrency('real', product.payload.price, product.payload.sale) }})</vs-button
            >
          </div>
        </template>
      </vs-dialog>
    </ValidationObserver>

    <h2 class="mt-0 mb-4 text-center" v-if="server">Каталог {{ server.name }}</h2>
    <div class="store-table-overflow position-relative" ref="store">
      <table class="store-table" v-if="products.data.length">
        <tr :key="product.payload.id" v-for="product in products.data">
          <td class="d-flex align-items-center">
            <Avatar v-if="product.payload.icon" size="large" :image="`${$config.apiUrl}/${product.payload.icon}`"> </Avatar>
            <Avatar v-else size="large"> <i class="bx bxs-image"></i> </Avatar>
            <div class="ms-3">
              <h4 class="m-0">
                {{ product.payload.name }} <small class="sale-wrapper ms-2" v-if="product.type == 'kit'">Набор</small>
                <small class="sale-wrapper ms-2" v-if="product.payload.sale">-{{ product.payload.sale }}%</small>
              </h4>
              <span v-text="product.payload.categories.map((c) => c.name).join(', ')" />
            </div>
          </td>
          <td>
            <strike v-if="product.payload.sale" v-text="$utils.formatCurrency('real', product.payload.price)" class="me-1"></strike>
            <span v-text="$utils.formatCurrency('real', product.payload.price, product.payload.sale)"></span>
            <h5 class="m-0">за 1 шт.</h5>
          </td>
          <td align="right">
            <vs-button @click="openDialog(product)">В корзину <i class="bx bxs-cart-add ms-1"></i></vs-button>
          </td>
        </tr>
      </table>
      <h4 class="text-center m-0" v-else>Нет результатов</h4>
    </div>
    <vs-pagination v-if="products.data.length" class="mt-4" v-model="products.meta.currentPage" :length="products.meta.totalPages" />
  </section>
</template>

<script>
import StoreProductsSidebar from '~/components/StoreProductsSidebar.vue'
import { mapGetters } from 'vuex'

export default {
  layout: 'cabinet',
  props: ['sidebar_component'],
  head: {
    title: 'Магазин',
  },
  data() {
    return {
      amount: 1,
      server: null,
      loading: false,
      page: 0,
      productDialog: false,
      product: null,
      products: {
        data: [],
        meta: {
          itemsPerPage: 20,
          totalItems: 0,
          currentPage: 1,
          totalPages: 1,
          sortBy: null,
        },
      },
    }
  },

  computed: {
    ...mapGetters({
      config: 'config',
    }),
  },

  created() {
    this.$nuxt.$on('storeFiltersUpdate', async (payload) => {
      try {
        await this.catalog(payload)
      } catch {}
    })
  },

  beforeDestroy() {
    this.$nuxt.$off('storeFiltersUpdate')
    this.$nuxt.$emit('setStoreSidebar', null)
  },

  async fetch() {
    try {
      this.server = await this.$axios.get(`/store/products/protected/servers/${this.$route.params.id}`).then((res) => res.data)
    } catch (_) {
      this.$nuxt.error({ statusCode: 404 })
    }
    this.$nuxt.$emit('setStoreSidebar', {
      component: StoreProductsSidebar,
      payload: {
        price: [this.server.min_price, this.server.max_price],
        categories: this.server.categories,
        range: {
          min: this.server.min_price,
          max: this.server.max_price,
        },
      },
    })
    this.catalog()
  },

  methods: {
    multiple_of_fix(value) {
      const fix = value % this.product.payload.multiple_of

      if (this.amount < 10000) {
        if (this.product.payload.multiple_of)
          this.amount = this.amount > this.product.payload.multiple_of ? this.amount - fix : this.product.payload.multiple_of
        this.step = this.amount
      } else {
        this.amount = 10000 - (10000 % (this.product.payload.multiple_of || 1))
      }
    },
    async openDialog(product) {
      this.product = product
      this.productDialog = true
      this.amount = product.payload.multiple_of || 1

      if (product.type == 'kit') {
        this.loading = true
        try {
          this.product.payload = await this.$axios.get(`/store/products/protected/kit/${this.product.payload.id}`).then((res) => res.data)
        } catch {
          this.productDialog = false
        }
        this.loading = false
      }
    },

    async addToCart() {
      this.loading = true
      try {
        await this.$axios.post('/store/cart/add', {
          id: this.product.payload.id,
          type: this.product.type,
          server_id: this.server.id,
          amount: this.amount,
        })
        this.$unicore.successNotification('Товар добавлен в корзину')
      } catch (e) {
        this.$unicore.errorNotification('Произошла неизвестная ошибка')
      }
      this.productDialog = false
      this.loading = false
    },

    async catalog(params = {}) {
      const priceFilter = []

      if (params.price) {
        priceFilter[0] = params.price[0] - 0.01
        priceFilter[1] = params.price[1] + 0.01
      }

      const loading = this.$vs.loading({ target: this.$refs.store })
      this.$nuxt.$emit('setStoreSidebarLoadingState', true)
      try {
        this.products = await this.$axios
          .get('/store/products/protected/products', {
            params: {
              page: this.products.meta.currentPage,
              limit: this.products.meta.itemsPerPage,
              sortBy: params.sort,
              search: params.search,
              'filter.server': this.$route.params.id,
              'filter.categories': params.category && params.category.length ? params.category : null,
              'filter.price': priceFilter.length && '$btw:' + priceFilter.join(','),
            },
          })
          .then((res) => res.data)
      } catch {}
      this.$nuxt.$emit('setStoreSidebarLoadingState', false)
      loading.close()
    },
  },
  watch: {
    'products.meta.currentPage': {
      handler: function (newValue) {
        this.catalog()
      },
    },
  },
}
</script>

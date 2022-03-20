<template>
  <section class="px-4">
    <ValidationObserver v-slot="{ invalid }">
      <vs-dialog class="buy-dialog" v-model="productDialog" v-if="product" :loading="loading" :prevent-close="loading" :not-close="loading">
        <template #header>
          <div class="d-flex flex-column align-items-center">
            <h4 class="mt-2 mb-0">Сервер: {{ server.name }}</h4>
            <h3 class="mt-0" v-text="product.name"></h3>
            <Avatar v-if="product.icon" size="xlarge" :image="`${$config.apiUrl}/${product.icon}`"> </Avatar>
            <Avatar v-else size="xlarge"> <i class="bx bxs-image"></i> </Avatar>
          </div>
        </template>
        <div class="description-html mt-3" v-if="product.description" v-html="product.description" />
        <ValidationProvider class="w-100" name="Количество" rules="required|integer|min_value:1|max_value:10000" v-slot="{ errors }">
          <vs-input class="mw-100 mt-4" v-model="product.amount" label="Количество">
            <template #message-danger v-if="errors[0]">
              {{ errors[0] }}
            </template>
          </vs-input>
        </ValidationProvider>
        <template #footer>
          <div v-if="!invalid" class="d-flex justify-content-center">
            <vs-button size="large" transparent @click="addToCart()">
              Добавить в корзину ({{ $utils.formatCurrency(product.price * product.amount, product.sale) }})</vs-button
            >
          </div>
        </template>
      </vs-dialog>
    </ValidationObserver>

    <h2 class="mt-0 mb-4 text-center " v-if="server">Каталог {{ server.name }}</h2>
    <div class="store-table-overflow position-relative" ref="store">
      <table class="store-table" v-if="products.data.length">
        <tr :key="product.id" v-for="product in products.data">
          <td class="d-flex align-items-center">
            <Avatar v-if="product.icon" size="large" :image="`${$config.apiUrl}/${product.icon}`"> </Avatar>
            <Avatar v-else size="large"> <i class="bx bxs-image"></i> </Avatar>
            <div class="ms-3">
              <h4 class="m-0">
                {{ product.name }} <small class="sale-wrapper ms-2" v-if="product.sale">-{{ product.sale }}%</small>
              </h4>
              <span v-text="product.categories.map((c) => c.name).join(', ')" />
            </div>
          </td>
          <td>
            <strike v-if="product.sale" v-text="$utils.formatCurrency(product.price)" class="me-1"></strike>
            <span v-text="$utils.formatCurrency(product.price, product.sale)"></span>
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

export default {
  layout: 'cabinet',
  props: ["sidebar_component"],
  data() {
    return {
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
          max: this.server.max_price
        }
      }
    })
    this.catalog()
  },

  methods: {
    openDialog(product) {
      product.amount = 1
      this.product = product
      this.productDialog = true
    },

    async addToCart() {
      this.loading = true
      try {
        await this.$axios.post('/store/cart/add', {
          product_id: this.product.id,
          server_id: this.server.id,
          amount: Number(this.product.amount),
        })
        this.$unicore.successNotification('Товар добавлен в корзину')
      } catch (e) {
        this.$unicore.errorNotification('Произошла неизвестная ошибка')
      }
      this.productDialog = false
      this.loading = false
    },

    async catalog(params = {}) {
      const loading = this.$vs.loading({ target: this.$refs.store, type: 'points' })
      this.$nuxt.$emit('setStoreSidebarLoadingState', true)
      try {
      this.products = await this.$axios
        .get('/store/products/protected/products', {
          params: {
            page: this.products.meta.currentPage,
            limit: this.products.meta.itemsPerPage,
            sortBy: params.sort,
            search: params.search,
            "filter.server": this.$route.params.id,
            "filter.price": params.price && "$btw:" + params.price.join(",")
          },
        })
        .then((res) => res.data)
      } catch {}
      this.$nuxt.$emit('setStoreSidebarLoadingState', false)
      loading.close();
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

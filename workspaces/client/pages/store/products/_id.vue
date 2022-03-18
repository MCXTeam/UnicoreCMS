<template>
  <section class="px-4">
    <h2 class="mt-0 mb-4" v-if="server">Каталог {{ server.name }}</h2>
    <div class="store-table-overflow position-relative" ref="store">
      <table class="store-table">
        <tr :key="product.id" v-for="product in products.data">
          <td class="d-flex align-items-center">
            <Avatar v-if="product.icon" size="large" :image="`${$config.apiUrl}/${product.icon}`"> </Avatar>
            <Avatar v-else size="large"> <i class="bx bxs-server"></i> </Avatar>
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
            <vs-button>В корзину <i class="bx bxs-cart-add ms-1"></i></vs-button>
          </td>
        </tr>
      </table>
    </div>
    <vs-pagination class="mt-4" v-model="products.meta.currentPage" :length="products.meta.totalPages" />
  </section>
</template>

<script>
export default {
  layout: 'cabinet',
  data() {
    return {
      server: null,
      page: 0,
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
  async fetch() {
    try {
      this.server = await this.$axios.get(`/servers/${this.$route.params.id}`).then((res) => res.data)
    } catch (_) {
      this.$nuxt.error({ statusCode: 404 })
    }
    this.catalog()
  },

  methods: {
    async catalog() {
      const loading = this.$vs.loading({ target: this.$refs.store })
      this.products = await this.$axios
        .get('/store/products', {
          params: {
            page: this.products.meta.currentPage,
            limit: this.products.meta.itemsPerPage,
            sortBy: this.products.meta.sortBy,
            search: null,
            filter: {
              servers: [this.$route.params.id],
            },
          },
        })
        .then((res) => res.data)
      loading.close()
    }
  },
  watch: {
      'products.meta.currentPage': {
        handler: function(newValue) {
          this.catalog()
        },
    }
  }
}
</script>

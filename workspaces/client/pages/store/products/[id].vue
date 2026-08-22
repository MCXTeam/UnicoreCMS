<template>
  <section class="px-4">
    <Dialog
      class="buy-dialog"
      v-if="product"
      v-model:visible="productDialog"
      modal
      :closable="!loading"
      :closeOnEscape="!loading"
      :dismissableMask="!loading"
    >
      <template #header>
        <div class="d-flex flex-column align-items-center">
          <h4 class="mt-2 mb-0">{{ $t('store.server', { server: server.name }) }}</h4>
          <h3 class="mt-0" v-if="product.type == 'product'" v-text="product.payload.name" />
          <h3 class="mt-0" v-else>{{ $t('store.kit_name', { name: product.payload.name }) }}</h3>
          <IconAvatar :path="product.payload.icon" size="xlarge" />
        </div>
    <ExtensionSlot name="store.catalog" />
      </template>
      <div class="description-html mb-3" v-if="product.payload.description" v-html="$sanitize(product.payload.description)" />
      <div v-if="product.type == 'product'" class="mb-4">
        <h5 class="text-uppercase my-2">{{ $t('store.amount', { amount }) }}</h5>
        <Slider
          v-model="amount"
          @change="multiple_of_fix"
          :min="product.payload.multiple_of || 1"
          :max="amount < 10000 ? amount + (product.payload.multiple_of || 1) * 10 : 10000 - (10000 % (product.payload.multiple_of || 1))"
          :step="product.payload.multiple_of || 1"
        />
      </div>
      <div v-else>
        <h3 class="mt-0 text-center">{{ $t('store.kit_contents') }}</h3>
        <div v-if="product.payload.items">
          <div class="d-flex mb-1" v-for="item in product.payload.items" :key="item.product.id">
            <IconAvatar :path="item.product.icon" />
            <h4 class="ms-2 my-0">{{ item.product.name }} x{{ item.amount }}</h4>
          </div>
        </div>
      </div>
      <Message
        v-if="
          product.payload.virtual_percent != 0 &&
          ((config.public_store_products_virtual_use && product.type == 'product') ||
            (config.public_store_kits_virtual_use && product.type == 'kit'))
        "
        severity="info"
        :closable="false"
        class="mt-3"
      >
        <i class="bx bxs-gift me-2"></i>
        {{ $t('store.virtual_hint', { percent: product.payload.virtual_percent || config.public_virtual_percent }) }}
      </Message>

      <ExtensionSlot name="store.product" :product="product" :server="server" />

      <GiftPurchase :payload="giftPayload" :price="giftPrice" @done="productDialog = false" />

      <template #footer>
        <div class="d-flex justify-content-center">
          <Button v-if="product.type == 'product'" size="large" text @click="addToCart()">
            {{
              $t('store.add_to_cart_price', { price: $utils.formatCurrency('real', product.payload.price * amount, product.payload.sale) })
            }}
          </Button>
          <Button v-else size="large" text @click="addToCart()">
            {{ $t('store.add_to_cart_price', { price: $utils.formatCurrency('real', product.payload.price, product.payload.sale) }) }}
          </Button>
        </div>
      </template>
    </Dialog>

    <h2 class="mt-0 mb-4 text-center" v-if="server">{{ $t('store.catalog', { server: server.name }) }}</h2>
    <div class="store-table-overflow position-relative">
      <table class="store-table" v-if="products.data.length">
        <tbody>
          <tr :key="product.payload.id" v-for="product in products.data">
            <td class="d-flex align-items-center">
              <IconAvatar :path="product.payload.icon" size="large" />
              <div class="ms-3">
                <h4 class="m-0">
                  {{ product.payload.name }} <small class="sale-wrapper ms-2" v-if="product.type == 'kit'">{{ $t('store.kit') }}</small>
                  <small class="sale-wrapper ms-2" v-if="product.payload.sale">-{{ product.payload.sale }}%</small>
                </h4>
                <span v-text="joinCategoryNames(product.payload.categories)" />
              </div>
            </td>
            <td>
              <strike v-if="product.payload.sale" v-text="$utils.formatCurrency('real', product.payload.price)" class="me-1"></strike>
              <span
                v-text="$utils.formatCurrency('real', product.payload.price * (product.payload.multiple_of || 1), product.payload.sale)"
              ></span>
              <h5 class="m-0" v-if="product.type == 'product'">
                {{ $t('store.price_per', { amount: product.payload.multiple_of || 1 }) }}
              </h5>
            </td>
            <td align="right">
              <Button @click="openDialog(product)">{{ $t('store.add_to_cart') }} <i class="bx bxs-cart-add ms-1"></i></Button>
            </td>
          </tr>
        </tbody>
      </table>
      <h4 class="text-center m-0" v-else>{{ $t('common.no_results') }}</h4>
    </div>
    <Paginator
      v-if="products.data.length"
      class="mt-4"
      :rows="products.meta.itemsPerPage"
      :totalRecords="products.meta.totalItems"
      :first="(products.meta.currentPage - 1) * products.meta.itemsPerPage"
      @page="onPage"
    />
  </section>
</template>

<script setup lang="ts">
import { useUiStore, type StoreFilters } from '~/stores/ui'

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'header.store' })

const { $unicore, $t } = useNuxtApp()

const catalogApi = useStoreCatalog()
const cartApi = useCart()

useHead({ title: computed(() => $t('header.store')) })
const route = useRoute()
const ui = useUiStore()
const { config } = usePublicConfig()

const amount = ref(1)
const server = ref<any>(null)
const loading = ref(false)
const productDialog = ref(false)
const product = ref<any>(null)
const products = reactive<{ data: any[]; meta: Record<string, any> }>({
  data: [],
  meta: {
    itemsPerPage: 20,
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    sortBy: null,
  },
})

const giftPayload = computed(() => ({
  type: product.value?.type,
  server: server.value?.id,
  product: product.value?.type == 'product' ? product.value?.payload.id : undefined,
  kit: product.value?.type == 'kit' ? product.value?.payload.id : undefined,
  amount: amount.value,
}))
const giftPrice = computed(() => {
  const payload = product.value?.payload
  if (!payload) return 0

  const price = payload.price * (product.value.type == 'product' ? amount.value : 1)

  return price - (price / 100) * (payload.sale || 0)
})

function joinCategoryNames(categories: Array<{ name: string }>) {
  return categories.map((c) => c.name).join(', ')
}

function multiple_of_fix(value: number | number[]) {
  const current = Array.isArray(value) ? value[0] : value
  const fix = current % product.value.payload.multiple_of

  if (amount.value < 10000) {
    if (product.value.payload.multiple_of)
      amount.value = amount.value > product.value.payload.multiple_of ? amount.value - fix : product.value.payload.multiple_of
  } else {
    amount.value = 10000 - (10000 % (product.value.payload.multiple_of || 1))
  }
}

async function openDialog(item: any) {
  product.value = item
  productDialog.value = true
  amount.value = item.payload.multiple_of || 1

  if (item.type == 'kit') {
    loading.value = true
    try {
      product.value.payload = await catalogApi.kit(product.value.payload.id)
    } catch {
      productDialog.value = false
    }
    loading.value = false
  }
}

async function addToCart() {
  loading.value = true
  try {
    await cartApi.add({
      id: product.value.payload.id,
      type: product.value.type,
      server_id: server.value.id,
      amount: amount.value,
    })
    $unicore.successNotification($t('store.added_to_cart'))
  } catch (e) {
    $unicore.errorNotification($t('common.unknown_error'))
  }
  productDialog.value = false
  loading.value = false
}

async function catalog(params: StoreFilters = {}) {
  const priceFilter: number[] = []

  if (params.price) {
    priceFilter[0] = params.price[0] - 0.01
    priceFilter[1] = params.price[1] + 0.01
  }

  const l = $unicore.loading()
  ui.setStoreSidebarLoading(true)
  try {
    const res = await catalogApi.products({
      page: products.meta.currentPage,
      limit: products.meta.itemsPerPage,
      sortBy: params.sort,
      search: params.search,
      'filter.server': route.params.id,
      'filter.categories': params.category ? params.category : null,
      'filter.price': priceFilter.length ? '$btw:' + priceFilter.join(',') : undefined,
    })
    products.data = res.data
    products.meta = res.meta
  } catch {}
  ui.setStoreSidebarLoading(false)
  l.close()
}

function onPage(event: { page: number }) {
  products.meta.currentPage = event.page + 1
}

watch(
  () => products.meta.currentPage,
  () => {
    catalog()
  },
)

watch(
  () => ui.storeFilters,
  async (filters) => {
    if (!filters) return
    try {
      await catalog(filters)
    } catch {}
  },
)

onMounted(async () => {
  try {
    server.value = await catalogApi.server(route.params.id as string)
  } catch (_) {
    showError(createError({ statusCode: 404, statusMessage: 'Not Found' }))
    return
  }
  ui.setStoreSidebar({
    component: 'StoreProductsSidebar',
    payload: {
      price: [server.value.min_price, server.value.max_price],
      categories: server.value.categories,
      range: {
        min: server.value.min_price,
        max: server.value.max_price,
      },
    },
  })
  catalog()
})

onBeforeUnmount(() => {
  ui.setStoreSidebar(null)
})
</script>

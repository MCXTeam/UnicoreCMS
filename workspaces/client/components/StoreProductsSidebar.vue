<template>
  <div class="mb-4">
    <Button :as="NuxtLink" to="/store/products" size="large" class="mx-0 mb-5 server-changer w-full"
      >{{ $t('store.change_server') }} <i class="bx bx-server"></i
    ></Button>

    <h3 class="text-uppercase">{{ $t('store.filters') }}</h3>
    <div class="store-filters">
      <InputText :disabled="loading" class="mw-100 mt-3" :placeholder="$t('store.search')" v-model="searchLocal" />
      <h5 class="text-uppercase mt-3 mb-0">{{ $t('store.category') }}</h5>
      <Select :disabled="loading" v-model="categoryLocal" :options="categoryOptions" optionLabel="label" optionValue="value" class="mt-1" />
      <h5 class="text-uppercase mt-3 mb-0">{{ $t('store.sorting') }}</h5>
      <Select :disabled="loading" v-model="sortLocal" :options="sortOptions" optionLabel="label" optionValue="value" class="mt-1" />
      <h5 class="text-uppercase mt-3 mb-0">{{ $t('store.price') }}</h5>
      <div class="px-2">
        <Slider :disabled="loading" v-model="priceLocal" :range="true" :min="range.min" :max="range.max" :step="0.01" class="mt-3" />
      </div>
      <div class="d-flex justify-content-between mt-2">
        <span>{{ $utils.formatCurrency('real', priceLocal[0]) }}</span>
        <span>{{ $utils.formatCurrency('real', priceLocal[1]) }}</span>
      </div>
      <Button :loading="loading" @click="update()" size="large" class="mx-0 mt-3 text-uppercase w-full" :label="$t('store.apply')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'
import { useUiStore } from '~/stores/ui'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Array,
    default: () => [0, 0],
  },
  categories: {
    type: Array,
    default: () => [],
  },
  range: {
    type: Object,
    default: () => ({ min: 0, max: 0 }),
  },
  category: {
    type: String,
    default: '0',
  },
  sort: {
    type: String,
    default: 'id:DESC',
  },
  search: {
    type: String,
    default: '',
  },
})

const priceLocal = ref([...(props.price as number[])])
const sortLocal = ref(props.sort)
const categoryLocal = ref(props.category)
const searchLocal = ref(props.search)

const { $t } = useNuxtApp()

const sortOptions = computed(() => [
  { label: $t('store.sort_new'), value: 'id:DESC' },
  { label: $t('store.sort_old'), value: 'id:ASC' },
  { label: $t('store.sort_expensive'), value: 'price:DESC' },
  { label: $t('store.sort_cheap'), value: 'price:ASC' },
  { label: $t('store.sort_name_desc'), value: 'name:DESC' },
  { label: $t('store.sort_name_asc'), value: 'name:ASC' },
])

const categoryOptions = computed(() => [
  { label: $t('store.all_categories'), value: '0' },
  ...(props.categories as Array<{ id: number; name: string }>).map((cat) => ({ label: cat.name, value: String(cat.id) })),
])

const ui = useUiStore()

function update() {
  ui.setStoreFilters({
    price: priceLocal.value,
    sort: sortLocal.value,
    category: Number(categoryLocal.value),
    search: searchLocal.value,
  })
}
</script>

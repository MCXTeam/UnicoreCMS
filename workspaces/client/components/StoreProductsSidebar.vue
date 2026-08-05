<template>
  <div class="mb-4">
    <Button :as="NuxtLink" to="/store/products" size="large" class="mx-0 mb-5 server-changer w-full"
      >Сменить сервер <i class="bx bx-server"></i
    ></Button>

    <h3 class="text-uppercase">Поиск и фильтры</h3>
    <div class="store-filters">
      <InputText :disabled="loading" class="mw-100 mt-3" placeholder="Поиск" v-model="searchLocal" />
      <h5 class="text-uppercase mt-3 mb-0">Категория</h5>
      <Select :disabled="loading" v-model="categoryLocal" :options="categoryOptions" optionLabel="label" optionValue="value" class="mt-1" />
      <h5 class="text-uppercase mt-3 mb-0">Сортировка</h5>
      <Select :disabled="loading" v-model="sortLocal" :options="sortOptions" optionLabel="label" optionValue="value" class="mt-1" />
      <h5 class="text-uppercase mt-3 mb-0">Цена</h5>
      <div class="px-2">
        <Slider :disabled="loading" v-model="priceLocal" :range="true" :min="range.min" :max="range.max" :step="0.01" class="mt-3" />
      </div>
      <div class="d-flex justify-content-between mt-2">
        <span>{{ $utils.formatCurrency('real', priceLocal[0]) }}</span>
        <span>{{ $utils.formatCurrency('real', priceLocal[1]) }}</span>
      </div>
      <Button :loading="loading" @click="update()" size="large" class="mx-0 mt-3 text-uppercase w-full" label="Применить" />
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

const sortOptions = [
  { label: 'Сначало новые', value: 'id:DESC' },
  { label: 'Сначало старые', value: 'id:ASC' },
  { label: 'Сначало дорогие', value: 'price:DESC' },
  { label: 'Сначало дешёвые', value: 'price:ASC' },
  { label: 'Название (Я-а)', value: 'name:DESC' },
  { label: 'Название (А-я)', value: 'name:ASC' },
]

const categoryOptions = computed(() => [
  { label: 'Все категории', value: '0' },
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

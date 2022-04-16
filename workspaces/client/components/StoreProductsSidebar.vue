<template>
  <div class="mb-4">
    <vs-button to="/store/products" block size="large" class="mx-0 mb-5 server-changer"
      >Сменить сервер <i class="bx bx-server"></i
    ></vs-button>

    <h3 class="text-uppercase">Поиск и фильтры</h3>
    <div class="store-filters">
      <vs-input :disabled="loading" class="mw-100 mt-3" placeholder="Поиск" v-model="searchLocal"></vs-input>
      <h5 class="text-uppercase mt-3 mb-0">Категория</h5>
      <vs-select :disabled="loading" v-model="categoryLocal" class="mt-1">
        <vs-option label="Все категории" value="0"> Все категории </vs-option>
        <vs-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="String(cat.id)" v-text="cat.name" />
      </vs-select>
      <h5 class="text-uppercase mt-3 mb-0">Сортировка</h5>
      <vs-select :disabled="loading" v-model="sortLocal" class="mt-1">
        <vs-option label="Сначало новые" value="id:DESC"> Сначало новые </vs-option>
        <vs-option label="Сначало старые" value="id:ASC"> Сначало старые </vs-option>
        <vs-option label="Сначало дорогие" value="price:DESC"> Сначало дорогие </vs-option>
        <vs-option label="Сначало дешёвые" value="price:ASC"> Сначало дешёвые </vs-option>
        <vs-option label="Название (Я-а)" value="name:DESC"> Название (Я-а) </vs-option>
        <vs-option label="Название (А-я)" value="name:ASC"> Название (А-я) </vs-option>
      </vs-select>
      <h5 class="text-uppercase mt-3 mb-0">Цена</h5>
      <div class="px-2">
        <Slider :disabled="loading" v-model="priceLocal" :range="true" :min="range.min" :max="range.max" :step="0.01" class="mt-3" />
      </div>
      <div class="d-flex justify-content-between mt-2">
        <span v-text="$utils.formatCurrency('real', priceLocal[0])" />
        <span v-text="$utils.formatCurrency('real', priceLocal[1])" />
      </div>
      <vs-button :loading="loading" @click="update()" block size="large" class="mx-0 mt-3 text-uppercase">Применить</vs-button>
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
    price: {
      type: Array,
      default: [0, 0],
    },
    categories: {
      type: Array,
      default: [],
    },
    range: {
      type: Object,
      default: { min: 0, max: 0 },
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
  },

  data() {
    return {
      priceLocal: this.price,
      sortLocal: this.sort,
      categoryLocal: this.category,
      searchLocal: this.search,
    }
  },

  methods: {
    update() {
      this.$nuxt.$emit('storeFiltersUpdate', {
        price: this.priceLocal,
        sort: this.sortLocal,
        category: Number(this.categoryLocal),
        search: this.searchLocal,
      })
    },
  },
}
</script>

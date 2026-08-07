<template>
  <div class="panel px-4 py-3 mb-4">
    <h3 class="text-uppercase m-0">{{ $t('store.payment') }}</h3>
    <div v-if="cartState.virtual_sale > 0" class="d-flex justify-content-between align-items-center mt-2">
      <div class="d-flex align-items-center gap-2">
        <Checkbox v-model="use_virtual" :binary="true" inputId="use_virtual" />
        <label for="use_virtual">{{ $t('store.use_bonuses') }}</label>
      </div>
      <b>-{{ $utils.formatCurrency('virtual', cartState.virtual_sale) }}</b>
    </div>
    <div class="d-flex justify-content-between mt-2">
      <span>{{ $t('store.total') }}</span>
      <b v-if="!use_virtual">{{ $utils.formatCurrency('real', cartState.price) }}</b>
      <div v-else>
        <small
          ><strike>{{ $utils.formatCurrency('real', cartState.price) }}</strike></small
        >
        <b>{{ $utils.formatCurrency('real', cartState.price - cartState.virtual_sale) }}</b>
      </div>
    </div>
    <div v-if="cartState.items.length" class="d-flex justify-content-between mt-2 gap-2">
      <Button @click="buyBus.emit()" :disabled="loading" size="large" class="flex-fill" :label="$t('store.pay')" />
      <Button @click="clearBus.emit()" :disabled="loading" severity="danger" size="large" class="flex-fill" :label="$t('store.clear')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEventBus } from '@vueuse/core'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  cart: {
    type: Object,
    default: () => ({ items: [], price: 0, virtual_sale: 0 }),
  },
})

const use_virtual = ref(false)
const cartState = ref(props.cart)

const buyBus = useEventBus('storeCartBuy')
const clearBus = useEventBus('storeCartClear')
const virtualBus = useEventBus('storeCartUseVirtualUpdate')
const updateBus = useEventBus('storeCartUpdate')

updateBus.on((payload: any) => {
  cartState.value = payload
})

watch(use_virtual, (val) => virtualBus.emit(val))
</script>

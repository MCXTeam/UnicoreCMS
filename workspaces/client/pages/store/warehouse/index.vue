<template>
  <div class="cab-grid">
    <CabTile :title="$t('store.warehouse_title')" icon="bx bx-package" :span="12">
      <template #actions>
        <Select
          class="cab-select"
          v-model="server_id"
          :options="serverOptions"
          optionLabel="label"
          optionValue="value"
          :loading="!servers.length"
          :placeholder="$t('store.choose_server')"
        />
      </template>

      <div v-if="warehouse.length" class="cab-offers">
        <div v-for="whItem in warehouse" :key="whItem.id" class="cab-offer">
          <IconAvatar :path="whItem.product.icon" size="large" />
          <div class="cab-offer__text">
            <div class="cab-offer__name">
              <h4 v-text="whItem.product.name" />
              <span class="cab-badge">#{{ whItem.id }}</span>
            </div>
            <div class="cab-offer__price">
              <span v-text="joinCategoryNames(whItem.product.categories)" />
            </div>
          </div>
          <div class="cab-servers__value">
            <span>{{ $moment(whItem.updated).format('DD.MM.YYYY, HH:mm') }}</span>
            <b>{{ $t('store.pieces', { amount: whItem.amount }) }}</b>
          </div>
        </div>
      </div>
      <div v-else class="cab-empty">
        <i class="bx bx-package"></i>
        <span>{{ $t('store.warehouse_empty') }}</span>
      </div>
    </CabTile>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'store.tab_warehouse', hint: 'store.warehouse_hint' })

const { $unicore, $t } = useNuxtApp()

const warehouseApi = useWarehouse()
const catalogApi = useStoreCatalog()

useHead({ title: computed(() => $t('store.tab_warehouse')) })
const ui = useUiStore()

const server_id = ref('0')
const warehouse = ref<any[]>([])
const servers = ref<any[]>([])

const serverOptions = computed(() => servers.value.map((server, index) => ({ label: server.name, value: String(index) })))

function joinCategoryNames(categories: Array<{ name: string }>) {
  return categories.map((c) => c.name).join(', ')
}

async function warehouseFind() {
  const loading = $unicore.loading()
  try {
    warehouse.value = await warehouseApi.items(servers.value[Number(server_id.value)].id)
  } catch {}
  loading.close()
}

watch(server_id, async () => {
  await warehouseFind()
})

onMounted(async () => {
  ui.setStoreSidebar({ component: 'WarehouseSidebar' })
  servers.value = await catalogApi.servers()

  if (!servers.value.length) return

  const filled = await warehouseApi.servers()
  const index = servers.value.findIndex((server) => filled.includes(server.id))
  const target = String(index === -1 ? 0 : index)

  if (target === server_id.value) warehouseFind()
  else server_id.value = target
})

onBeforeUnmount(() => {
  ui.setStoreSidebar(null)
})
</script>

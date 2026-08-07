<template>
  <div class="px-4">
    <div class="d-flex justify-content-between">
      <h2 class="mt-0 mb-4">{{ $t('store.warehouse_title') }}</h2>
      <Select
        v-model="server_id"
        :options="serverOptions"
        optionLabel="label"
        optionValue="value"
        :loading="!servers.length"
        :placeholder="$t('store.choose_server')"
        style="max-width: 150px"
      />
    </div>

    <div class="store-table-overflow position-relative">
      <table class="store-table" v-if="warehouse.length">
        <tr :key="whItem.id" v-for="whItem in warehouse">
          <td class="d-flex align-items-center">
            <Avatar v-if="whItem.product.icon" size="large" :image="`${apiUrl}/${whItem.product.icon}`"> </Avatar>
            <Avatar v-else size="large"> <i class="bx bxs-image"></i> </Avatar>
            <div class="ms-3">
              <h4 class="m-0">
                {{ whItem.product.name }} <small class="sale-wrapper ms-2">#{{ whItem.id }}</small>
              </h4>
              <span v-text="joinCategoryNames(whItem.product.categories)" />
            </div>
          </td>
          <td align="right">
            <small v-text="$moment(whItem.updated).format('DD.MM.YYYY, HH.mm')" />
            <h4 class="m-0">{{ $t('store.pieces', { amount: whItem.amount }) }}</h4>
          </td>
        </tr>
      </table>
      <h4 class="text-center m-0" v-else>{{ $t('store.warehouse_empty') }}</h4>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'store.tab_warehouse' })

const { $api, $unicore, $t } = useNuxtApp()

useHead({ title: computed(() => $t('store.tab_warehouse')) })
const apiUrl = useRuntimeConfig().public.apiBaseurl
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
    warehouse.value = await $api.get('/store/warehouse/' + servers.value[Number(server_id.value)].id).then((res) => res.data)
  } catch {}
  loading.close()
}

watch(server_id, async () => {
  await warehouseFind()
})

onMounted(async () => {
  ui.setStoreSidebar({ component: 'WarehouseSidebar' })
  servers.value = await $api.get('/store/products/protected/servers').then((res) => res.data)

  if (!servers.value.length) return

  const filled = await $api.get('/store/warehouse/servers').then((res) => res.data)
  const index = servers.value.findIndex((server) => filled.includes(server.id))
  const target = String(index === -1 ? 0 : index)

  if (target === server_id.value) warehouseFind()
  else server_id.value = target
})

onBeforeUnmount(() => {
  ui.setStoreSidebar(null)
})
</script>

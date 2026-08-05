<template>
  <div class="px-4">
    <h2 class="m-0">Банлист</h2>
    <p class="mt-1 mb-2">
      В банлист попадают только плохие игроки, которые нарушили правила наших серверов. Избегайте бана! Следуйте
      <NuxtLink to="/page/rules">правилам проекта</NuxtLink> и никогда не будете забанены.
    </p>
    <div>
      <DataTable
        class="no-overflow-table mt-4 large-table"
        :value="banlist.data"
        lazy
        paginator
        :rows="banlist.meta.itemsPerPage"
        :totalRecords="banlist.meta.totalItems"
        :loading="loading"
        dataKey="id"
        @page="onPage($event)"
      >
        <Column header="Игрок" headerStyle="width: 25%">
          <template #body="{ data }">
            <div class="d-flex align-items-center">
              <Avatar class="rounded shadow me-3">
                <SkinView2D class="rounded" :width="32" :height="32" :skin="data.user.skin" />
              </Avatar>
              <NuxtLink :to="`/user/` + data.user.username">{{ data.user.username }}</NuxtLink>
            </div>
          </template>
        </Column>
        <Column header="Дата бана" headerStyle="width: 20%">
          <template #body="{ data }">{{ $moment(data.created).format('DD.MM.YYYY, HH:mm:ss') }}</template>
        </Column>
        <Column header="Дата разбана" headerStyle="width: 20%">
          <template #body="{ data }">{{
            data.expires ? $moment(data.expires).format('DD.MM.YYYY, HH:mm:ss') : 'Никогда'
          }}</template>
        </Column>
        <Column header="Модератор" headerStyle="width: 25%">
          <template #body="{ data }">
            <NuxtLink v-if="data.actor && data.actor.username != 'Kernel'" :to="`/user/` + data.actor.username">
              {{ data.actor.username }}
            </NuxtLink>
            <span v-else>Консоль</span>
          </template>
        </Column>
        <Column header="Причина">
          <template #body="{ data }">{{ data.reason }}</template>
        </Column>
        <template #empty>
          <span>Нет результатов</span>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'] })
useHead({ title: 'Банлист' })
useUiStore().setName('Игроки')

const { $api } = useNuxtApp()

const loading = ref(false)
const banlist = ref<any>({
  data: [],
  meta: {
    itemsPerPage: 25,
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
  },
})

async function load() {
  loading.value = true
  banlist.value = await $api.get('players/banlist', { params: { page: banlist.value.meta.currentPage } }).then((res) => res.data)
  loading.value = false
}

function onPage(event: any) {
  banlist.value.meta.currentPage = event.page + 1
  load()
}

onMounted(load)
</script>

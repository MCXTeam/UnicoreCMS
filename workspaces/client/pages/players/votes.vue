<template>
  <div class="px-4">
    <div class="d-flex align-items-center justify-content-between w-100">
      <h2 class="m-0">Топ голосующих за {{ $moment().format('MMMM') }}</h2>
      <NuxtLink to="/cabinet/gifts">
        <Button size="large" label="Голосовать" />
      </NuxtLink>
    </div>
    <div v-if="votesGifts.length">
      <h4 class="m-0">Что вы получите заняв призовое место?</h4>
      <div class="row d-flex justify-content-center my-3">
        <div v-for="vg in votesGifts" :key="vg.id" class="col-6 col-lg mb-2">
          <div class="mini-profile px-3 py-2" :class="'vote-gift-' + vg.place">
            <h3 class="m-0">{{ vg.place }} место</h3>
            <span v-text="$utils.formatCurrency('real', vg.bonus)" />
          </div>
        </div>
      </div>
    </div>
    <div>
      <DataTable
        class="no-overflow-table mt-4 large-table"
        :value="votes.data"
        lazy
        paginator
        :rows="25"
        :totalRecords="votes.meta.total * 25"
        :loading="loading"
        dataKey="user.uuid"
        @page="onPage($event)"
      >
        <Column header="Место" headerStyle="width: 4rem; max-width: 4rem">
          <template #body="{ index }">
            <h3 class="m-0">#{{ (votes.meta.total - 1) * 25 + index + 1 }}</h3>
          </template>
        </Column>
        <Column header="Игрок" headerStyle="width: 30%">
          <template #body="{ data }">
            <div class="d-flex align-items-center">
              <Avatar class="rounded shadow me-3">
                <SkinView2D class="rounded" :width="32" :height="32" :skin="data.user.skin" />
              </Avatar>
              <NuxtLink :to="`/user/` + data.user.username">{{ data.user.username }}</NuxtLink>
            </div>
          </template>
        </Column>
        <Column header="Голосов" headerStyle="width: 30%">
          <template #body="{ data }">{{ data.total }}</template>
        </Column>
        <Column header="Последний голос">
          <template #body="{ data }">{{ $moment(data.updated).format('DD.MM.YYYY, HH:mm:ss') }}</template>
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
useHead({ title: 'Топ-голосующих' })
useUiStore().setName('Игроки')

const { $api } = useNuxtApp()

const loading = ref(false)
const votesGifts = ref<any[]>([])
const votes = ref<any>({
  data: [],
  meta: {
    page: 1,
    total: 1,
  },
})

async function load() {
  loading.value = true
  votes.value = await $api.get('players/votes-list', { params: { page: votes.value.meta.page } }).then((res) => res.data)
  loading.value = false
}

function onPage(event: any) {
  votes.value.meta.page = event.page + 1
  load()
}

onMounted(async () => {
  await load()
  votesGifts.value = await $api.get('cabinet/votes/gifts').then((res) => res.data)
})
</script>

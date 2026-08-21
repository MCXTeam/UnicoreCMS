<template>
  <div class="px-4">
    <div class="d-flex align-items-center justify-content-between w-100">
      <h2 class="m-0">{{ $t('players.votes_title', { month: $moment().format('MMMM') }) }}</h2>
      <NuxtLink to="/cabinet/gifts">
        <Button size="large" :label="$t('panel.vote_button')" />
      </NuxtLink>
    </div>
    <div v-if="votesGifts.length">
      <h4 class="m-0">{{ $t('players.votes_prizes') }}</h4>
      <div class="row d-flex justify-content-center my-3">
        <div v-for="vg in votesGifts" :key="vg.id" class="col-6 col-lg mb-2">
          <div class="mini-profile px-3 py-2" :class="'vote-gift-' + vg.place">
            <h3 class="m-0">{{ $t('players.place_number', { place: vg.place }) }}</h3>
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
        <Column :header="$t('players.place')" headerStyle="width: 4rem; max-width: 4rem">
          <template #body="{ index }">
            <h3 class="m-0">#{{ (votes.meta.total - 1) * 25 + index + 1 }}</h3>
          </template>
        </Column>
        <Column :header="$t('players.player')" headerStyle="width: 30%">
          <template #body="{ data }">
            <div class="d-flex align-items-center">
              <Avatar class="rounded shadow me-3">
                <SkinView2D class="rounded" :width="32" :height="32" :skin="data.user.skin" />
              </Avatar>
              <NuxtLink :to="`/user/${data.user.username}`">{{ data.user.username }}</NuxtLink>
            </div>
          </template>
        </Column>
        <Column :header="$t('players.votes_count')" headerStyle="width: 30%">
          <template #body="{ data }">{{ data.total }}</template>
        </Column>
        <Column :header="$t('players.last_vote')">
          <template #body="{ data }">{{ $moment(data.updated).format('DD.MM.YYYY, HH:mm:ss') }}</template>
        </Column>
        <template #empty>
          <span>{{ $t('common.no_results') }}</span>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'header.players' })

const { $t } = useNuxtApp()

const votesApi = useVotes()

useHead({ title: computed(() => $t('players.tab_votes')) })
useUiStore().setName($t('header.players'))

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
  votes.value = await votesApi.list({ page: votes.value.meta.page })
  loading.value = false
}

function onPage(event: any) {
  votes.value.meta.page = event.page + 1
  load()
}

onMounted(async () => {
  await load()
  votesGifts.value = await votesApi.gifts()
})
</script>

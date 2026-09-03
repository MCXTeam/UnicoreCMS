<template>
  <div class="cab-grid">
    <CabTile v-if="votesGifts.length" :title="$t('players.votes_prizes')" icon="bx bx-medal" :span="12">
      <div class="cab-prizes">
        <div v-for="vg in votesGifts" :key="vg.id" :class="['cab-prize', 'vote-gift-' + vg.place]">
          <h3 class="m-0">{{ $t('players.place_number', { place: vg.place }) }}</h3>
          <span v-text="$utils.formatCurrency('real', vg.bonus)" />
        </div>
      </div>
    </CabTile>

    <CabTile :title="$t('players.votes_title', { month: $moment().format('MMMM') })" icon="bx bx-party" :span="12">
      <template #actions>
        <NuxtLink to="/cabinet/votes">
          <Button size="small" :label="$t('panel.vote_button')" />
        </NuxtLink>
      </template>
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
    </CabTile>
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

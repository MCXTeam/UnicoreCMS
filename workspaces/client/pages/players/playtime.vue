<template>
  <div class="cab-grid">
    <CabTile :title="$t('players.tab_playtime')" icon="bx bx-game" :span="12">
      <DataTable
        class="no-overflow-table mt-4 large-table"
        :value="playtimes.data"
        lazy
        paginator
        :rows="25"
        :totalRecords="playtimes.meta.total * 25"
        :loading="loading"
        dataKey="user.uuid"
        @page="onPage($event)"
      >
        <Column :header="$t('players.place')" headerStyle="width: 4rem; max-width: 4rem">
          <template #body="{ index }">
            <h3 class="m-0">#{{ (playtimes.meta.page - 1) * 25 + index + 1 }}</h3>
          </template>
        </Column>
        <Column :header="$t('players.player')" headerStyle="width: 60%">
          <template #body="{ data }">
            <div class="d-flex align-items-center">
              <Avatar class="rounded shadow me-3">
                <SkinView2D class="rounded" :width="32" :height="32" :skin="data.user.skin" />
              </Avatar>
              <NuxtLink :to="`/user/${data.user.username}`">{{ data.user.username }}</NuxtLink>
            </div>
          </template>
        </Column>
        <Column :header="$t('players.playtime')">
          <template #body="{ data }">
            {{ $utils.formatDuration(data.time) }}
          </template>
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

const playersApi = usePlayers()

useHead({ title: computed(() => $t('players.tab_playtime')) })
useUiStore().setName($t('header.players'))

const loading = ref(false)
const playtimes = ref<any>({
  data: [],
  meta: {
    page: 1,
    total: 1,
  },
})

async function load() {
  loading.value = true
  playtimes.value = await playersApi.playtime({ page: playtimes.value.meta.page })
  loading.value = false
}

function onPage(event: any) {
  playtimes.value.meta.page = event.page + 1
  load()
}

onMounted(load)
</script>

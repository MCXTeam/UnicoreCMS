<template>
  <div class="px-4">
    <h2 class="m-0">{{ $t('players.tab_banlist') }}</h2>
    <p class="mt-1 mb-2">
      {{ $t('players.banlist_hint_before') }}
      <NuxtLink to="/page/rules">{{ $t('players.banlist_hint_link') }}</NuxtLink>
      {{ $t('players.banlist_hint_after') }}
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
        <Column :header="$t('players.player')" headerStyle="width: 25%">
          <template #body="{ data }">
            <div class="d-flex align-items-center">
              <Avatar class="rounded shadow me-3">
                <SkinView2D class="rounded" :width="32" :height="32" :skin="data.user.skin" />
              </Avatar>
              <NuxtLink :to="`/user/${data.user.username}`">{{ data.user.username }}</NuxtLink>
            </div>
          </template>
        </Column>
        <Column :header="$t('players.ban_date')" headerStyle="width: 20%">
          <template #body="{ data }">{{ $moment(data.created).format('DD.MM.YYYY, HH:mm:ss') }}</template>
        </Column>
        <Column :header="$t('players.unban_date')" headerStyle="width: 20%">
          <template #body="{ data }">{{
            data.expires ? $moment(data.expires).format('DD.MM.YYYY, HH:mm:ss') : $t('players.never')
          }}</template>
        </Column>
        <Column :header="$t('players.moderator')" headerStyle="width: 25%">
          <template #body="{ data }">
            <NuxtLink v-if="data.actor && data.actor.username != 'Kernel'" :to="`/user/${data.actor.username}`">
              {{ data.actor.username }}
            </NuxtLink>
            <span v-else>{{ $t('players.console') }}</span>
          </template>
        </Column>
        <Column :header="$t('players.reason')">
          <template #body="{ data }">{{ data.reason }}</template>
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

const { $api, $t } = useNuxtApp()

useHead({ title: computed(() => $t('players.tab_banlist')) })
useUiStore().setName($t('header.players'))

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

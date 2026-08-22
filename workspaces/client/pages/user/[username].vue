<template>
  <div class="row">
    <div class="col-xl-4">
      <div class="panel">
        <div class="d-flex flex-column align-items-center text-center w-100">
          <ClientOnly>
            <SkinView3D class="rounded" :width="210" :height="300" :skin="user.skin" :cloak="user.cloak" ref="skin" />
          </ClientOnly>
          <h2 class="mt-2 mb-0" v-text="user.username" />
          <h4 v-if="!online" class="m-0">{{ $t('profile.offline') }}</h4>
          <h4 v-else class="m-0">
            {{ $t('profile.playing_on') }} <NuxtLink :to="`/servers/${online.server.id}`" v-text="online.server.name" />
          </h4>
        </div>
      </div>
    </div>
    <div class="col-xl-8">
      <div class="panel">
        <h2 class="mt-0 mb-3">{{ $t('profile.account_info') }}</h2>
        <table class="player-info-table w-100">
          <tbody>
            <tr>
              <td>{{ $t('profile.login') }}</td>
              <td v-text="user.username" />
            </tr>
            <tr>
              <td>{{ $t('profile.registered') }}</td>
              <td v-text="$moment(user.created).format('D MMMM YYYY, HH:mm')" />
            </tr>
            <tr>
              <td>{{ $t('profile.account_age') }}</td>
              <td v-text="$utils.formatDuration($moment().diff($moment(user.created)), 'milliseconds')" />
            </tr>
            <tr>
              <td>{{ $t('profile.votes_this_month') }}</td>
              <td v-text="user.votes" />
            </tr>
            <tr>
              <td>{{ $t('profile.total_playtime') }}</td>
              <td v-text="$utils.formatDuration($_.sumBy(user.playtimes, 'time'))" />
            </tr>
            <tr>
              <td>{{ $t('profile.ban') }}</td>
              <td v-if="!user.ban">{{ $t('profile.ban_none') }}</td>
              <td v-else>{{ $t('profile.ban_yes') }}</td>
            </tr>
          </tbody>
        </table>
        <h2 class="mt-4 mb-3">{{ $t('profile.server_stats') }}</h2>
        <div v-for="pt in user.playtimes" :key="pt.server.id" class="d-flex align-items-center mb-2">
          <Avatar size="large" v-if="pt.server.icon" :image="`${$pub.apiBaseurl}/${pt.server.icon}`"> </Avatar>
          <Avatar size="large" v-else> <i class="bx bxs-server"></i> </Avatar>
          <div class="ms-4">
            <h3 class="text-uppercase m-0" v-text="pt.server.name" />
            <span v-if="pt.time">{{ $utils.formatDuration(pt.time) }}</span>
            <span v-else>{{ $t('profile.never_played') }}</span>
          </div>
        </div>
        <h2 class="mb-3 mt-4">{{ $t('profile.referals') }}</h2>
        <DataTable :value="user.referals" class="no-overflow-table">
          <Column :header="$t('common.date')">
            <template #body="{ data }">{{ $moment(data.user.created).format('DD.MM.YYYY, HH:mm:ss') }}</template>
          </Column>
          <Column :header="$t('profile.login')" :style="{ width: '35%' }">
            <template #body="{ data }">
              <div class="d-flex align-items-center">
                <Avatar class="rounded shadow me-3">
                  <ClientOnly>
                    <SkinView2D class="rounded" :width="32" :height="32" :skin="data.user.skin" />
                  </ClientOnly>
                </Avatar>
                <NuxtLink :to="`/user/${data.user.username}`">{{ data.user.username }}</NuxtLink>
              </div>
            </template>
          </Column>
          <Column :header="$t('players.playtime')" :style="{ width: '35%' }">
            <template #body="{ data }">{{ $utils.formatDuration(data.playtime) }}</template>
          </Column>
          <template #empty>
            <span>{{ $t('common.empty') }}</span>
          </template>
        </DataTable>
      </div>
      <ExtensionSlot name="user.profile" :user="user" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'landing' })

const { $moment, $t } = useNuxtApp()

const playersApi = usePlayers()
const route = useRoute()

const { data, error } = await useAsyncData<any>(`user-${route.params.username}`, async () => {
  const user = await playersApi.profile(route.params.username as string)
  const online = user.playtimes.find((pt: any) => pt.updated != pt.created && $moment(pt.updated).isAfter($moment().subtract(2, 'minutes')))
  return { user, online }
})

if (error.value || !data.value) throw createError({ statusCode: 404, fatal: true })

const user = computed<any>(() => data.value.user)
const online = computed<any>(() => data.value.online)

useUiStore().setName($t('profile.page_name', { username: user.value.username }))
useHead({ title: computed(() => $t('profile.page_name', { username: user.value.username })) })

const skin = ref<any>(null)

onMounted(async () => {
  await skin.value?.ready

  skin.value?.viewer?.playerObject?.rotation.set(0, 0.3, 0)
})
</script>

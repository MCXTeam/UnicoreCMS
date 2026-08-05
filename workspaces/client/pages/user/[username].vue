<template>
  <div class="row">
    <div class="col-xl-4">
      <div class="panel">
        <div class="d-flex flex-column align-items-center text-center w-100">
          <ClientOnly>
            <SkinView3D class="rounded" :width="210" :height="300" :skin="user.skin" :cloak="user.cloak" ref="skin" />
          </ClientOnly>
          <h2 class="mt-2 mb-0" v-text="user.username" />
          <h4 v-if="!online" class="m-0">Офлайн</h4>
          <h4 v-else class="m-0">Играет на <NuxtLink :to="`/servers/${online.server.id}`" v-text="online.server.name" /></h4>
        </div>
      </div>
    </div>
    <div class="col-xl-8">
      <div class="panel">
        <h2 class="mt-0 mb-3">Сведения об аккаунте</h2>
        <table class="player-info-table w-100">
          <tr>
            <td>Логин</td>
            <td v-text="user.username" />
          </tr>
          <tr>
            <td>Регистрация</td>
            <td v-text="$moment(user.created).format('D MMMM YYYY, HH:mm')" />
          </tr>
          <tr>
            <td>Стаж аккаунта</td>
            <td v-text="$moment.duration($moment().diff($moment(user.created))).format()" />
          </tr>
          <tr>
            <td>Голосов за этот месяц</td>
            <td v-text="user.votes" />
          </tr>
          <tr>
            <td>Общее время онлайн</td>
            <td
              v-text="
                $moment
                  .duration($_.sumBy(user.playtimes, 'time'), 'minutes')
                  .format('y [years], w [weeks], d [days], h [hours], m [minutes]')
              "
            />
          </tr>
          <tr>
            <td>Блокировка</td>
            <td v-if="!user.ban">Отсутствует</td>
            <td v-else>Да</td>
          </tr>
        </table>
        <h2 class="mt-4 mb-3">Статистика на серверах</h2>
        <div v-for="pt in user.playtimes" :key="pt.server.id" class="d-flex align-items-center mb-2">
          <Avatar size="large" v-if="pt.server.icon" :image="`${$pub.apiBaseurl}/${pt.server.icon}`"> </Avatar>
          <Avatar size="large" v-else> <i class="bx bxs-server"></i> </Avatar>
          <div class="ms-4">
            <h3 class="text-uppercase m-0" v-text="pt.server.name" />
            <span v-if="pt.time">{{
              $moment.duration(pt.time, 'minutes').format('y [years], w [weeks], d [days], h [hours], m [minutes]')
            }}</span>
            <span v-else>Еще не играл(а) на этом сервере</span>
          </div>
        </div>
        <h2 class="mb-3 mt-4">Приглашённые игроки</h2>
        <DataTable :value="user.referals" class="no-overflow-table">
          <Column header="Дата">
            <template #body="{ data }">{{ $moment(data.user.created).format('DD.MM.YYYY, HH:mm:ss') }}</template>
          </Column>
          <Column header="Логин" :style="{ width: '35%' }">
            <template #body="{ data }">
              <div class="d-flex align-items-center">
                <Avatar class="rounded shadow me-3">
                  <ClientOnly>
                    <SkinView2D class="rounded" :width="32" :height="32" :skin="data.user.skin" />
                  </ClientOnly>
                </Avatar>
                <NuxtLink :to="`/user/` + data.user.username">{{ data.user.username }}</NuxtLink>
              </div>
            </template>
          </Column>
          <Column header="Время в игре" :style="{ width: '35%' }">
            <template #body="{ data }">{{
              $moment.duration(data.playtime, 'minutes').format('y [years], w [weeks], d [days], h [hours], m [minutes]')
            }}</template>
          </Column>
          <template #empty>
            <span>Тут пусто...</span>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'landing' })

const { $api, $moment } = useNuxtApp()
const route = useRoute()

const { data, error } = await useAsyncData<any>(`user-${route.params.username}`, async () => {
  const user = await $api.get(`/users/public/user/${route.params.username}`).then((res) => res.data)
  const online = user.playtimes.find((pt: any) => pt.updated != pt.created && $moment(pt.updated).isAfter($moment().subtract(2, 'minutes')))
  return { user, online }
})

if (error.value || !data.value) throw createError({ statusCode: 404, fatal: true })

const user = computed<any>(() => data.value.user)
const online = computed<any>(() => data.value.online)

useUiStore().setName(`Профиль игрока ${user.value.username}`)
useHead({ title: `Профиль ${user.value.username}` })

const skin = ref<any>(null)

onMounted(() => {
  skin.value?.viewer?.playerObject?.rotation.set(0, 0.3, 0)
})
</script>

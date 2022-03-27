<template>
  <div class="row">
    <div class="col-xl-4">
      <div class="panel">
        <div class="d-flex flex-column align-items-center text-center w-100">
          <SkinView3D class="rounded" :width="210" :height="300" :skin="user.skin" :cloak="user.cloak" ref="skin" />
          <h2 class="mt-2 mb-0" v-text="user.username" />
          <h4 v-if="!online" class="m-0">Офлайн</h4>
          <h4 v-else class="m-0">Играет на <nuxt-link :to="`/server/${online.server.id}`" v-text="online.server.name" /></h4>
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
            <td v-text="$moment(user.created).local().format('D MMMM YYYY, HH:mm')" />
          </tr>
          <tr>
            <td>Стаж аккаунта</td>
            <td v-text="$moment.duration($moment() - $moment(user.created)).format()" />
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
          <Avatar size="large" v-if="pt.server.icon" :image="`${$config.apiUrl}/${pt.server.icon}`"> </Avatar>
          <Avatar size="large" v-else> <i class="bx bxs-server"></i> </Avatar>
          <div class="ms-4">
            <h3 class="text-uppercase m-0" v-text="pt.server.name" />
            <span v-if="pt.time"
              >{{ $moment.duration(pt.time, 'minutes').format('y [years], w [weeks], d [days], h [hours], m [minutes]') }}, последняя
              активность {{ $moment(pt.updated).local().format('D MMMM YYYY, HH:mm') }}</span
            >
            <span v-else>Еще не играл(а) на этом сервере</span>
          </div>
        </div>
        <h2 class="mb-3 mt-4">Приглашённые игроки</h2>
        <vs-table class="no-overflow-table">
          <template #thead>
            <vs-tr>
              <vs-th>Дата </vs-th>
              <vs-th style="width: 35%">Логин </vs-th>
              <vs-th style="width: 35%">Время в игре </vs-th>
            </vs-tr>
          </template>
          <template #tbody>
            <vs-tr :key="referal.uuid" v-for="referal in user.referals" :data="referal">
              <vs-td> {{ $moment(referal.user.created).local().format('DD.MM.YYYY, HH:mm:ss') }} </vs-td>
              <vs-td>
                <div class="d-flex align-items-center">
                  <Avatar class="rounded shadow me-3">
                    <SkinView2D class="rounded" :width="32" :height="32" :skin="referal.user.skin" />
                  </Avatar>
                  <nuxt-link :to="`/user/` + referal.user.username">{{ referal.user.username }}</nuxt-link>
                </div>
              </vs-td>
              <vs-td>{{
                $moment.duration(referal.playtime, 'minutes').format('y [years], w [weeks], d [days], h [hours], m [minutes]')
              }}</vs-td>
            </vs-tr>
          </template>
          <template #notFound>
            <span>Тут пусто...</span>
          </template>
        </vs-table>
      </div>
    </div>
  </div>
</template>

<script>
import SkinViewer2D from '../../../admin/components/SkinView2D.vue'

export default {
  layout: 'landing',

  components: {
    SkinViewer2D,
  },

  head() {
    return {
      title: `Профиль ${this.user.username}`,
    }
  },

  mounted() {
    if (process.client) this.$refs.skin.viewer.playerObject.rotation.set(0, 0.3, 0)
  },

  async asyncData({ $axios, error, route, store, $moment }) {
    try {
      const user = await $axios.get(`/users/public/user/${route.params.username}`).then((res) => res.data)
      const online = user.playtimes.find((pt) => pt.updated != pt.created && $moment().isSame(pt.updated))

      store.commit('unicore/SET_NAME', `Профиль игрока ${user.username}`)

      return { user, online }
    } catch {
      error({ statusCode: 404 })
    }
  },
}
</script>

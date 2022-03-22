<template>
  <div class="px-4">
    <div class="row">
      <div class="col-xl-7">
        <h2 class="mt-0 mb-4">История авторизаций</h2>
      </div>
      <div class="col">
        <h4 class="mt-0 mb-1">Завершить сеансы</h4>
        <vs-button-group class="mb-4">
          <vs-button @click="sessionsOther()" block flat>Другие</vs-button>
          <vs-button @click="sessionsAll()" block flat>Все</vs-button>
        </vs-button-group>
      </div>
    </div>
    <vs-table class="no-overflow-table">
      <template #thead>
        <vs-tr>
          <vs-th style="width: 35%"> Устройство </vs-th>
          <vs-th style="width: 15%"> IP </vs-th>
          <vs-th style="width: 20%"> Последняя активность </vs-th>
          <vs-th style="width: 20%"> Создан </vs-th>
          <vs-th style="width: 10%"> </vs-th>
        </vs-tr>
      </template>
      <template #tbody>
        <vs-tr :key="session.id" v-for="session in sessions.all" :data="session">
          <vs-td>
            <vs-tooltip>
              {{
                session.agent == 'launcher'
                  ? 'Лаунчер'
                  : $utils.uaParse(session.agent).raw + (session.id == sessions.curnet.id ? ' (Текущий)' : '')
              }}
              <template #tooltip> UUID: {{ session.uuid }} </template>
            </vs-tooltip>
          </vs-td>
          <vs-td> {{ session.ip }} </vs-td>
          <vs-td> {{ $moment(session.updated).local().format('D MMMM YYYY, HH:mm:ss') }} </vs-td>
          <vs-td> {{ $moment(session.created).local().format('D MMMM YYYY, HH:mm:ss') }} </vs-td>
          <vs-td>
            <vs-button :ref="`session-${session.id}`" :loading="false" danger @click="sessionDelete(session.id)"><i class="bx bx-trash"></i></vs-button>
          </vs-td>
        </vs-tr>
      </template>
    </vs-table>
  </div>
</template>

<script>
export default {
  layout: 'cabinet',

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Личный кабинет')
  },

  data() {
    return {
      sessions: {
        curnet: null,
        all: [],
      },
    }
  },

  async fetch() {
    this.sessions = await this.$axios
      .post('/auth/sessions/me', {
        token: this.$auth.strategy.refreshToken.get(),
      })
      .then((res) => res.data)

    if (!this.sessions.curnet) this.$unicore.logout()
  },

  methods: {
    async sessionDelete(id) {
      this.$refs[`session-${id}`][0].loading = true
      await this.$axios.delete(`/auth/sessions/${id}`)
      await this.$fetch()
    },

    async sessionsAll() {
      const loading = this.$vs.loading()
      await this.$axios.delete(`/auth/sessions_all`)
      await this.$fetch()
      loading.close()
    },

    async sessionsOther() {
      const loading = this.$vs.loading()
      await this.$axios.delete(`/auth/sessions_other`, {
        data: {
          token: this.$auth.strategy.refreshToken.get()
        }
      })
      await this.$fetch()
      loading.close()
    }
  }
}
</script>

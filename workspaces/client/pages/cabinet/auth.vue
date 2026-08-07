<template>
  <div class="px-4">
    <div class="row">
      <div class="col-xl-7">
        <h2 class="mt-0 mb-4">{{ $t('cabinet.tab_auth') }}</h2>
      </div>
      <div class="col">
        <h4 class="mt-0 mb-1">{{ $t('cabinet.end_sessions') }}</h4>
        <div class="p-buttonset d-flex mb-4">
          <Button @click="sessionsOther()" text :label="$t('cabinet.sessions_other')" class="flex-fill" />
          <Button @click="sessionsAll()" text :label="$t('cabinet.sessions_all')" class="flex-fill" />
        </div>
      </div>
    </div>
    <DataTable class="no-overflow-table large-table" :value="sessions.all">
      <Column headerStyle="width: 35%" :header="$t('cabinet.device')">
        <template #body="{ data }">
          <span v-tooltip="`UUID: ${data.uuid}`">
            {{
              data.agent == 'launcher'
                ? $t('cabinet.launcher')
                : $utils.uaParse(data.agent).raw + (data.id == sessions.curnet.id ? ` (${$t('cabinet.current_session')})` : '')
            }}
          </span>
        </template>
      </Column>
      <Column headerStyle="width: 15%" header="IP">
        <template #body="{ data }"> {{ data.ip }} </template>
      </Column>
      <Column headerStyle="width: 20%" :header="$t('cabinet.last_activity')">
        <template #body="{ data }"> {{ $moment(data.updated).format('D MMMM YYYY, HH:mm:ss') }} </template>
      </Column>
      <Column headerStyle="width: 20%" :header="$t('cabinet.session_created')">
        <template #body="{ data }"> {{ $moment(data.created).format('D MMMM YYYY, HH:mm:ss') }} </template>
      </Column>
      <Column headerStyle="width: 10%">
        <template #body="{ data }">
          <Button :loading="deletingId == data.id" severity="danger" @click="sessionDelete(data.id)"><i class="bx bx-trash"></i></Button>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script>
definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'verify'],
  title: 'cabinet.tab_auth',
})

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('header.cabinet')) })
  },

  data() {
    return {
      deletingId: null,
      sessions: {
        curnet: null,
        all: [],
      },
    }
  },

  mounted() {
    this.load()
  },

  methods: {
    async load() {
      this.sessions = await this.$api
        .post('/auth/sessions/me', {
          token: this.$auth.refreshToken,
        })
        .then((res) => res.data)

      if (!this.sessions.curnet) this.$unicore.logout()
    },

    async sessionDelete(id) {
      this.deletingId = id
      await this.$api.delete(`/auth/sessions/${id}`)
      await this.load()
      this.deletingId = null
    },

    async sessionsAll() {
      const loading = this.$unicore.loading()
      await this.$api.delete(`/auth/sessions_all`)
      await this.load()
      loading.close()
    },

    async sessionsOther() {
      const loading = this.$unicore.loading()
      await this.$api.delete(`/auth/sessions_other`, {
        data: {
          token: this.$auth.refreshToken,
        },
      })
      await this.load()
      loading.close()
    },
  },
}
</script>

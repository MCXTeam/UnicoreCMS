<template>
  <div class="cab-grid">
    <CabTile :title="$t('cabinet.sessions')" icon="bx bx-devices" :span="12">
      <template #actions>
        <div class="d-flex gap-2">
          <Button size="small" outlined :label="$t('cabinet.sessions_other')" @click="sessionsOther()" />
          <Button size="small" outlined severity="danger" :label="$t('cabinet.sessions_all')" @click="sessionsAll()" />
        </div>
      </template>
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
            <Button :loading="deletingId == data.id" severity="danger" text @click="sessionDelete(data.id)">
              <i class="bx bx-trash"></i>
            </Button>
          </template>
        </Column>
      </DataTable>
    </CabTile>
  </div>
</template>

<script>
definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'verify'],
  title: 'cabinet.tab_auth',
  hint: 'cabinet.auth_hint',
})

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('header.cabinet')) })

    return { cabinet: useCabinet() }
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
      this.sessions = await this.cabinet.sessions(this.$auth.refreshToken)

      if (!this.sessions.curnet) this.$unicore.logout()
    },

    async sessionDelete(id) {
      this.deletingId = id
      await this.cabinet.closeSession(id)
      await this.load()
      this.deletingId = null
    },

    async sessionsAll() {
      const loading = this.$unicore.loading()
      await this.cabinet.closeAllSessions()
      await this.load()
      loading.close()
    },

    async sessionsOther() {
      const loading = this.$unicore.loading()
      await this.cabinet.closeOtherSessions(this.$auth.refreshToken)
      await this.load()
      loading.close()
    },
  },
}
</script>

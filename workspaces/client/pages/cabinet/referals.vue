<template>
  <div class="cab-grid">
    <CabTile :title="$t('cabinet.referal_you_get')" icon="bx bxs-megaphone" :span="6" accent>
      <div class="cab-metric">
        {{ $t('cabinet.referal_to_balance', { amount: $utils.formatCurrency('real', config.public_referal_reward) }) }}
      </div>
      <p class="cab-sub mt-2 mb-0">
        {{ $t('cabinet.referal_you_condition', { time: $utils.formatDuration(config.public_referal_trigger) }) }}
      </p>
    </CabTile>

    <CabTile :title="$t('cabinet.referal_player_gets')" icon="bx bx-user-plus" :span="6">
      <div class="cab-metric">
        {{ $t('cabinet.referal_to_balance', { amount: $utils.formatCurrency('real', config.public_referal_reward_player) }) }}
      </div>
      <p class="cab-sub mt-2 mb-0">
        {{ $t('cabinet.referal_player_condition', { time: $utils.formatDuration(config.public_referal_trigger) }) }}
      </p>
    </CabTile>

    <CabTile v-if="percent > 0" :title="$t('cabinet.referal_percent')" icon="bx bx-wallet" :span="12">
      <div class="cab-metric">{{ percent }}%</div>
      <p class="cab-sub mt-2 mb-0">{{ $t('cabinet.referal_percent_hint') }}</p>
    </CabTile>

    <CabTile :title="$t('cabinet.referal_link')" icon="bx bx-link" :span="12">
      <p class="cab-sub mt-0 mb-3">{{ $t('cabinet.referal_intro') }}</p>
      <div class="cab-copy">
        <InputText class="w-100" v-model="link" readonly />
        <Button :label="$t('common.copy')" @click="copyLink()" />
      </div>
    </CabTile>

    <CabTile :title="$t('profile.referals')" icon="bx bx-group" :span="12">
      <DataTable class="no-overflow-table large-table" :value="referals">
        <Column :header="$t('common.date')">
          <template #body="{ data }"> {{ $moment(data.user.created).format('DD.MM.YYYY, HH:mm:ss') }} </template>
        </Column>
        <Column headerStyle="width: 35%" :header="$t('profile.login')">
          <template #body="{ data }">
            <div class="d-flex align-items-center">
              <Avatar class="rounded shadow me-3">
                <SkinView2D class="rounded" :width="32" :height="32" :skin="data.user.skin" />
              </Avatar>
              <NuxtLink :to="`/user/${data.user.username}`">{{ data.user.username }}</NuxtLink>
            </div>
          </template>
        </Column>
        <Column headerStyle="width: 35%" :header="$t('players.playtime')">
          <template #body="{ data }">
            {{ $utils.formatDuration(data.playtime) }}
          </template>
        </Column>
        <template #empty>
          <span>{{ $t('cabinet.referal_empty') }}</span>
        </template>
      </DataTable>
    </CabTile>
  </div>
</template>

<script>
definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'verify'],
  title: 'cabinet.tab_referals',
  hint: 'cabinet.referal_hint',
})

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('header.cabinet')) })

    return { config: usePublicConfig().config, cabinet: useCabinet() }
  },

  data() {
    return {
      link: '',
      referals: [],
      percent: 0,
    }
  },

  mounted() {
    this.link = `${this.$pub.baseurl}/start?ref=${this.$auth.user.username}`
    this.load()
  },

  methods: {
    async load() {
      const [referals, reward] = await Promise.all([this.cabinet.referals(), this.cabinet.referalPercent().catch(() => ({ percent: 0 }))])

      this.referals = referals
      this.percent = Number(reward?.percent) || 0
    },

    async copyLink() {
      await navigator.clipboard.writeText(this.link)
      this.$unicore.successNotification(this.$t('cabinet.link_copied'))
    },
  },
}
</script>

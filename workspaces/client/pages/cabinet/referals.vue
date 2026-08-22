<template>
  <div>
    <section class="px-4 pb-4">
      <h2 class="mt-0 mb-3">{{ $t('cabinet.referal_title') }}</h2>
      <p>{{ $t('cabinet.referal_intro') }}</p>
      <div class="row">
        <div class="col-xl-6">
          <h4 class="m-0">{{ $t('cabinet.referal_you_get') }}</h4>
          <div class="mini-profile p-4 my-3 h-75">
            <h2 class="mt-0 mb-2">
              {{ $t('cabinet.referal_to_balance', { amount: $utils.formatCurrency('real', config.public_referal_reward) }) }}
            </h2>
            <span>{{ $t('cabinet.referal_you_condition', { time: $utils.formatDuration(config.public_referal_trigger) }) }}</span>
          </div>
        </div>
        <div class="col-xl-6">
          <h4 class="m-0">{{ $t('cabinet.referal_player_gets') }}</h4>
          <div class="mini-profile p-4 my-3 h-75">
            <h2 class="mt-0 mb-2">
              {{ $t('cabinet.referal_to_balance', { amount: $utils.formatCurrency('real', config.public_referal_reward_player) }) }}
            </h2>
            <span>{{ $t('cabinet.referal_player_condition', { time: $utils.formatDuration(config.public_referal_trigger) }) }}</span>
          </div>
        </div>
      </div>
    </section>
    <hr />
    <section class="px-4 pb-4">
      <h2 class="mt-4 mb-3">{{ $t('cabinet.referal_link') }}</h2>
      <div class="row">
        <div class="col-xl-9 input-fw d-flex align-items-center">
          <InputText class="w-100" v-model="link" readonly />
        </div>
        <div class="col d-flex align-items-center">
          <Button @click="copyLink()" class="w-100" size="large" :label="$t('common.copy')" />
        </div>
      </div>
      <h3 class="mb-3 mt-4">{{ $t('profile.referals') }}</h3>
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
    </section>
  </div>
</template>

<script>

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'verify'],
  title: 'cabinet.tab_referals',
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
    }
  },

  mounted() {
    this.link = `${this.$pub.baseurl}/start?ref=${this.$auth.user.username}`
    this.load()
  },

  methods: {
    async load() {
      this.referals = await this.cabinet.referals()
    },

    async copyLink() {
      await navigator.clipboard.writeText(this.link)
      this.$unicore.successNotification(this.$t('cabinet.link_copied'))
    },
  },
}
</script>

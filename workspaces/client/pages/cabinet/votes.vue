<template>
  <div class="cab-grid">
    <CabTile :title="$t('panel.vote')" icon="bx bx-party" :span="monitorings.length ? 7 : 12">
      <div v-if="monitorings.length" class="cab-servers">
        <div v-for="mon in monitorings" :key="mon" class="cab-servers__row">
          <img class="cab-mon__icon" :src="monitorings_map[mon].icon" />
          <div>
            <h4 v-text="monitorings_map[mon].name" />
            <span>{{
              $t('cabinet.vote_reward_once', { amount: $utils.formatCurrency('virtual', config.public_monitoring_reward) })
            }}</span>
          </div>
          <Button class="ms-auto" size="small" as="a" :href="config['public_link_' + mon]" :label="$t('cabinet.vote')" />
        </div>
      </div>
      <div v-else class="cab-empty">
        <i class="bx bx-party"></i>
        <span>{{ $t('cabinet.monitorings_empty') }}</span>
      </div>
    </CabTile>

    <CabTile
      v-if="monitorings.length"
      :title="$t('cabinet.vote_reward_title', { count: monitorings.length })"
      icon="bx bx-medal"
      :span="5"
    >
      <p class="cab-sub mt-0 mb-3">{{ $t('cabinet.vote_reward_text') }}</p>
      <div class="cab-metrics">
        <div class="cab-metrics__item">
          <span class="cab-metrics__label">{{ $t('cabinet.bonuses') }}</span>
          <span class="cab-metrics__value">
            {{ $utils.formatCurrency('virtual', config.public_monitoring_reward * monitorings.length) }}
          </span>
        </div>
        <div class="cab-metrics__item">
          <span class="cab-metrics__label">{{ $t('cabinet.top_points') }}</span>
          <span class="cab-metrics__value cab-metrics__value--soft" v-text="monitorings.length" />
        </div>
      </div>
    </CabTile>

    <CabTile v-if="votesGifts.length" :title="$t('players.votes_prizes')" icon="bx bx-trophy" :span="12">
      <p class="cab-sub mt-0 mb-3">{{ $t('cabinet.votes_prizes_text') }}</p>
      <div class="cab-prizes">
        <div v-for="vg in votesGifts" :key="vg.id" :class="['cab-prize', 'vote-gift-' + vg.place]">
          <h3 class="m-0">{{ $t('players.place_number', { place: vg.place }) }}</h3>
          <span v-text="$utils.formatCurrency('real', vg.bonus)" />
        </div>
      </div>
      <NuxtLink to="/players/votes">
        <Button class="mt-3" size="small" text :label="$t('cabinet.votes_top_link')" />
      </NuxtLink>
    </CabTile>
  </div>
</template>

<script setup>
import monitoringsMap from '~/json/monitorings.json'

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'cabinet.tab_votes', hint: 'cabinet.votes_hint' })

const { $t } = useNuxtApp()

const votesApi = useVotes()
const { config } = usePublicConfig()

useHead({ title: computed(() => $t('cabinet.tab_votes')) })

const monitorings_map = monitoringsMap
const monitorings = ref([])
const votesGifts = ref([])

onMounted(async () => {
  monitorings.value = await votesApi.monitorings().catch(() => [])
  votesGifts.value = await votesApi.gifts().catch(() => [])
})
</script>

<template>
  <div class="cab-grid">
    <CabTile :title="$t('profile.server_stats')" icon="bx bx-bar-chart-alt-2" :span="7">
      <div v-if="playtime" class="cab-servers">
        <div v-for="pt in playtime" :key="pt.server.id" class="cab-servers__row">
          <IconAvatar :path="pt.server.icon" size="large" icon="bx bxs-server" />
          <div>
            <h4 v-text="pt.server.name" />
            <span v-text="pt.server.id" />
          </div>
          <div class="cab-servers__value">
            <span>{{ $t('cabinet.playtime') }}</span>
            <b v-if="pt.time">{{ $utils.formatDuration(pt.time) }}</b>
            <b v-else>{{ $t('cabinet.never_played') }}</b>
          </div>
        </div>
      </div>
      <div v-else class="cab-servers">
        <Skeleton v-for="n in 3" :key="n" height="62px" borderRadius="14px" />
      </div>
    </CabTile>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'cabinet.tab_stats', hint: 'cabinet.stats_hint' })

const { $t } = useNuxtApp()

const cabinet = useCabinet()

useHead({ title: computed(() => $t('header.cabinet')) })
const playtime = ref(null)

onMounted(async () => {
  playtime.value = await cabinet.playtime()
})
</script>

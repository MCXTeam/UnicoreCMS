<template>
  <div class="cab-grid">
    <CabTile :title="$t('profile.server_stats')" icon="bx bx-bar-chart-alt-2" :span="12">
      <Message v-if="playtimeError" severity="error" :closable="false">{{ $t('cabinet.stats_load_error') }}</Message>
      <div v-else-if="playtime" class="cab-servers cab-servers--grid">
        <div v-for="pt in playtime" :key="pt.server.id" class="cab-playtime">
          <div class="cab-playtime__server">
            <IconAvatar :path="pt.server.icon" size="large" icon="bx bxs-server" />
            <h4>{{ pt.server.name }}</h4>
          </div>
          <dl v-if="pt.connectedMs != null" class="cab-playtime__metrics">
            <div><dt>{{ $t('cabinet.connected_time') }}</dt><dd>{{ $utils.formatDuration(pt.connectedMs / 1000, 'seconds') }}</dd></div>
            <div><dt>{{ $t('cabinet.active_time') }}</dt><dd>{{ $utils.formatDuration(pt.activeMs / 1000, 'seconds') }}</dd></div>
            <div v-if="pt.legacyBaselineMs"><dt>{{ $t('cabinet.legacy_playtime') }}</dt><dd>{{ $utils.formatDuration(pt.legacyBaselineMs / 1000, 'seconds') }}</dd></div>
          </dl>
          <dl v-else class="cab-playtime__metrics">
            <div><dt>{{ $t('cabinet.playtime') }}</dt><dd>{{ pt.time ? $utils.formatDuration(pt.time) : $t('cabinet.never_played') }}</dd></div>
          </dl>
        </div>
      </div>
      <div v-else class="cab-servers cab-servers--grid">
        <Skeleton v-for="n in 3" :key="n" height="150px" borderRadius="14px" />
      </div>
    </CabTile>
    <CabTile :title="$t('punishments.title')" icon="bx bx-shield-quarter" :span="12">
      <PunishmentFeed own />
    </CabTile>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'cabinet.tab_stats', hint: 'cabinet.stats_hint' })

const { $t } = useNuxtApp()
useHead({ title: computed(() => $t('header.cabinet')) })
const { playtime, playtimeError } = useCabinetStats()
</script>

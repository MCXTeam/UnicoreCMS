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
    <CabTile :title="$t('cabinet.game_punishments')" icon="bx bx-shield-quarter" :span="12">
      <Message v-if="punishmentsError" severity="error" :closable="false">{{ $t('cabinet.punishments_load_error') }}</Message>
      <Skeleton v-else-if="punishments === null" height="62px" borderRadius="14px" />
      <p v-else-if="!punishments.length" class="m-0">{{ $t('cabinet.no_game_punishments') }}</p>
      <div v-else class="cab-punishments">
        <article v-for="punishment in punishments" :key="punishment.id" class="cab-punishments__row">
          <div class="cab-punishments__heading">
            <b>{{ $t(`cabinet.punishment_kind_${punishment.kind}`) }} · {{ serverName(punishment.scope.serverId) }}</b>
            <Tag :severity="punishment.status === 'ACTIVE' ? 'warn' : 'secondary'" :value="$t(`cabinet.punishment_status_${punishment.status}`)" />
          </div>
          <p>{{ punishment.reason }}</p>
          <span v-if="punishment.expiresAtMs">{{ $t('cabinet.punishment_until', { date: $moment(punishment.expiresAtMs).format('D MMMM YYYY, HH:mm') }) }}</span>
          <span v-else-if="punishment.kind === 'BAN' || punishment.kind === 'MUTE'">{{ $t('cabinet.punishment_permanent') }}</span>
        </article>
      </div>
    </CabTile>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'cabinet.tab_stats', hint: 'cabinet.stats_hint' })

const { $t } = useNuxtApp()
useHead({ title: computed(() => $t('header.cabinet')) })
const { playtime, punishments, playtimeError, punishmentsError } = useCabinetStats()
const serverName = (id) => playtime.value?.find((row) => row.server.id === id)?.server.name || id
</script>

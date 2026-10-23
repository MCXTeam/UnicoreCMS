<template>
  <div class="cab-grid">
    <CabTile :title="$t('players.tab_banlist')" icon="bx bxs-shield-alt-2" :span="12">
      <p class="cab-sub mt-0 mb-3">{{ $t('punishments.banlist_hint') }}</p>
      <PunishmentFeed />
    </CabTile>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'header.players' })
const { $t } = useNuxtApp()
useHead({ title: computed(() => $t('players.tab_banlist')) })
useUiStore().setName($t('header.players'))
</script>

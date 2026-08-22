<template>
  <div>
    <ClientOnly>
      <div v-if="$auth.user" class="panel d-none d-xl-flex flex-column align-items-center py-4 mb-5">
        <h3 class="mb-4 mt-0"><i class="bx bx-user"></i> {{ $t('panel.hello', { username: $auth.user.username }) }}</h3>
        <div class="d-flex align-items-center w-100 mb-2 mini-profile p-2">
          <Avatar class="rounded shadow me-3" size="large">
            <SkinView2D class="rounded" :width="48" :height="48" :skin="$auth.user.skin" />
          </Avatar>
          <div>
            <h4 class="m-0">{{ $t('panel.balance', { amount: $utils.formatCurrency('real', $auth.user.real) }) }}</h4>
          </div>
        </div>
        <div class="tab-panel w-100">
          <Button :as="NuxtLink" to="/cabinet" text class="m-0 w-100" size="large" :label="$t('header.cabinet')" />
          <Button :as="NuxtLink" to="/store" text class="m-0 w-100" size="large" :label="$t('header.store')" />
          <Button :as="NuxtLink" to="/players" text class="m-0 w-100" size="large" :label="$t('header.players')" />
          <Button @click="$unicore.logout()" text severity="danger" class="m-0 w-100" size="large" :label="$t('header.logout')" />
        </div>
      </div>
      <div v-else class="panel d-flex flex-column align-items-center py-4 mb-5">
        <h2 class="mb-4 mt-0"><i class="bx bx-key"></i> {{ $t('panel.auth') }}</h2>
        <Button :as="NuxtLink" to="/auth" size="large" class="px-4" :label="$t('header.login')" />
        <div class="d-flex mt-3 justify-content-center gap-2">
          <Button :as="NuxtLink" to="/auth/register" text size="small" class="m-0" :label="$t('panel.register')" />
          <Button :as="NuxtLink" to="/auth/reset" text size="small" class="m-0" :label="$t('panel.reset_password')" />
        </div>
      </div>
    </ClientOnly>
    <div class="panel d-flex flex-column align-items-center text-center py-4 mb-5">
      <h2 class="mb-4 mt-0"><i class="bx bx-gift"></i> {{ $t('panel.vote') }}</h2>
      <img src="/images/chest-minecraft.gif" height="180px" />
      <p class="mb-3">{{ $t('panel.vote_text') }}</p>
      <div class="d-flex">
        <Button :as="NuxtLink" to="/cabinet/gifts" text class="m-0" size="large" :label="$t('panel.vote_button')" />
      </div>
    </div>
    <h2 class="mt-0">{{ $t('panel.servers') }}</h2>
    <div v-if="onlines.servers" class="">
      <div v-for="online in onlines.servers" :key="online.server.id" class="mb-4">
        <div class="onlines d-flex justify-content-between align-items-end mb-3">
          <div class="d-flex">
            <IconAvatar :path="online.server.icon" size="xlarge" icon="bx bxs-server" />
            <div class="ms-3">
              <span>{{ $t('panel.version') }}: {{ online.server.version }}</span>
              <NuxtLink :to="`/servers/${online.server.id}`">
                <h3 class="mb-1 mt-0">{{ online.server.name }}</h3>
              </NuxtLink>
            </div>
          </div>
          <div class="d-flex flex-column align-items-end">
            <div v-tooltip.top="$t('panel.record_tooltip', { record: online.record, today: online.record_today })">
              <h2 v-if="online.online" class="mb-1 mt-0">
                <ClientOnly>
                  <CountTo :startVal="0" :endVal="online.players" :duration="1000" />
                  <template #fallback>{{ online.players }}</template>
                </ClientOnly>
              </h2>
              <h2 v-else class="mb-1 mt-0 text-uppercase">{{ $t('panel.offline') }}</h2>
            </div>
            <span v-if="online.online">{{ $t('panel.of') }} {{ online.maxplayers }}</span>
          </div>
        </div>
        <ProgressBar style="height: 0.5em" :showValue="false" :value="(online.players / online.maxplayers) * 100" />
        <div v-if="online.server.instances?.length" class="server-instances mt-2">
          <div v-for="instance in online.server.instances" :key="instance.name" class="d-flex justify-content-between align-items-center">
            <span>{{ instance.name }}</span>
            <span v-if="instance.online">{{ instance.players }} {{ $t('panel.of') }} {{ instance.maxplayers }}</span>
            <span v-else class="text-uppercase">{{ $t('panel.offline') }}</span>
          </div>
        </div>
      </div>
      <div class="text-center">
        <p class="m-0">
          {{ $t('panel.total_online') }}:
          <b>
            <ClientOnly>
              <CountTo :startVal="0" :endVal="onlines.total.online" :duration="1000" />
              <template #fallback>{{ onlines.total.online }}</template>
            </ClientOnly>
          </b>
        </p>
        <p class="m-0" v-tooltip.top="$moment(onlines.total.records.today.created).format('D MMMM YYYY, HH:mm')">
          {{ $t('panel.record_today') }}:
          <b>
            <ClientOnly>
              <CountTo :startVal="0" :endVal="onlines.total.records.today.online" :duration="1000" />
              <template #fallback>{{ onlines.total.records.today.online }}</template>
            </ClientOnly>
          </b>
        </p>
        <p class="m-0" v-tooltip.top="$moment(onlines.total.records.absolute.created).format('D MMMM YYYY, HH:mm')">
          {{ $t('panel.record_absolute') }}:
          <b>
            <ClientOnly>
              <CountTo :startVal="0" :endVal="onlines.total.records.absolute.online" :duration="1000" />
              <template #fallback>{{ onlines.total.records.absolute.online }}</template>
            </ClientOnly>
          </b>
        </p>
      </div>
    </div>
    <div v-else class="d-flex flex-column align-items-center">
      <div class="d-flex w-100" v-for="(n, index) in 3" :key="index">
        <Skeleton size="4rem" class="me-2 mb-3"></Skeleton>
        <div style="flex: 1">
          <Skeleton width="100%" class="mb-2"></Skeleton>
          <Skeleton width="75%"></Skeleton>
        </div>
      </div>
      <Skeleton width="70%" class="my-2"></Skeleton>
      <Skeleton width="70%" class="mb-2"></Skeleton>
      <Skeleton width="70%" class="mb-2"></Skeleton>
    </div>
    <ClientOnly>
      <div class="d-flex flex-column social-blocks pt-3">
        <a v-if="config.public_link_discord" class="px-4 py-3 mt-3 discord" :href="config.public_link_discord" target="_blank">
          <h2 class="m-0 d-flex align-items-center"><i class="bx bxl-discord-alt me-2"></i> Discord</h2>
        </a>
        <a v-if="config.public_link_vk" class="px-4 py-3 mt-3 vk" :href="config.public_link_vk" target="_blank">
          <h2 class="m-0 d-flex align-items-center"><i class="bx bxl-vk me-2"></i> ВКонтакте</h2>
        </a>
        <a v-if="config.public_link_telegram" class="px-4 py-3 mt-3 telegram" :href="config.public_link_telegram" target="_blank">
          <h2 class="m-0 d-flex align-items-center"><i class="bx bxl-telegram me-2"></i> Telegram</h2>
        </a>
        <a v-if="config.public_link_youtube" class="px-4 py-3 mt-3 youtube" :href="config.public_link_youtube" target="_blank">
          <h2 class="m-0 d-flex align-items-center"><i class="bx bxl-youtube me-2"></i> YouTube</h2>
        </a>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'

defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
  onlines: {
    type: Object,
    default: () => ({}),
  },
})
</script>

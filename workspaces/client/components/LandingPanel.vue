<template>
  <div>
    <ClientOnly>
      <div v-if="$auth.user" class="panel d-none d-xl-flex flex-column align-items-center py-4 mb-5">
        <h3 class="mb-4 mt-0"><i class="bx bx-user"></i> Привет, {{ $auth.user.username }}</h3>
        <div class="d-flex align-items-center w-100 mb-2 mini-profile p-2">
          <Avatar class="rounded shadow me-3" size="large">
            <SkinView2D class="rounded" :width="48" :height="48" :skin="$auth.user.skin" />
          </Avatar>
          <div>
            <h4 class="m-0">Баланс: {{ $utils.formatCurrency('real', $auth.user.real) }}</h4>
          </div>
        </div>
        <div class="tab-panel w-100">
          <Button as="NuxtLink" to="/cabinet" text class="m-0 w-full" size="large" label="Личный кабинет" />
          <Button as="NuxtLink" to="/store" text class="m-0 w-full" size="large" label="Магазин" />
          <Button as="NuxtLink" to="/players" text class="m-0 w-full" size="large" label="Игроки" />
          <Button @click="$unicore.logout()" text severity="danger" class="m-0 w-full" size="large" label="Выйти из системы" />
        </div>
      </div>
      <div v-else class="panel d-flex flex-column align-items-center py-4 mb-5">
        <h2 class="mb-4 mt-0"><i class="bx bx-key"></i> Авторизация</h2>
        <Button as="NuxtLink" to="/auth" size="large" class="px-4" label="Войти" />
        <div class="d-flex mt-3">
          <Button as="NuxtLink" to="/auth/register" text class="m-0" label="Регистрация" />
          <Button as="NuxtLink" to="/auth/reset" text class="m-0" label="Сбросить пароль" />
        </div>
      </div>
    </ClientOnly>
    <div class="panel d-flex flex-column align-items-center text-center py-4 mb-5">
      <h2 class="mb-4 mt-0"><i class="bx bx-gift"></i> Голосование</h2>
      <img src="/images/chest-minecraft.gif" height="180px" />
      <p class="mb-3">Голосуй за нас и получай приятные бонусы: игровую валюту, кейсы, предметы!</p>
      <div class="d-flex">
        <Button as="NuxtLink" to="/cabinet/gifts" text class="m-0" size="large" label="Голосовать" />
      </div>
    </div>
    <h2 class="mt-0">Серверы</h2>
    <div v-if="onlines.servers" class="">
      <div v-for="online in onlines.servers" :key="online.server.id" class="mb-4">
        <div class="onlines d-flex justify-content-between align-items-end mb-3">
          <div class="d-flex">
            <Avatar v-if="online.server.icon" size="xlarge" :image="`${$pub.apiBaseurl}/${online.server.icon}`" />
            <Avatar v-else size="xlarge"> <i class="bx bxs-server"></i> </Avatar>
            <div class="ms-3">
              <span>Версия: {{ online.server.version }}</span>
              <NuxtLink :to="`/servers/${online.server.id}`">
                <h3 class="mb-1 mt-0">{{ online.server.name }}</h3>
              </NuxtLink>
            </div>
          </div>
          <div class="d-flex flex-column align-items-end">
            <div v-tooltip.top="`Рекорд: ${online.record} / Сегодня: ${online.record_today}`">
              <h2 v-if="online.online" class="mb-1 mt-0"><CountTo :startVal="0" :endVal="online.players" :duration="1000" /></h2>
              <h2 v-else class="mb-1 mt-0 text-uppercase">Off</h2>
            </div>
            <span v-if="online.online">из {{ online.maxplayers }}</span>
          </div>
        </div>
        <ProgressBar style="height: 0.5em" :showValue="false" :value="(online.players / online.maxplayers) * 100" />
      </div>
      <div class="text-center">
        <p class="m-0">
          Общий онлайн: <b><CountTo :startVal="0" :endVal="onlines.total.online" :duration="1000" /></b>
        </p>
        <p class="m-0" v-tooltip.top="$moment(onlines.total.records.today.created).local().format('D MMMM YYYY, HH:mm')">
          Рекорд за сегодня: <b><CountTo :startVal="0" :endVal="onlines.total.records.today.online" :duration="1000" /></b>
        </p>
        <p class="m-0" v-tooltip.top="$moment(onlines.total.records.absolute.created).local().format('D MMMM YYYY, HH:mm')">
          Рекорд за всё время: <b><CountTo :startVal="0" :endVal="onlines.total.records.absolute.online" :duration="1000" /></b>
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

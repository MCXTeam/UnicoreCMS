<template>
  <section class="px-4">
    <h2 class="mt-0 mb-4">{{ $t('profile.server_stats') }}</h2>
    <div v-if="playtime">
      <div v-for="pt in playtime" :key="pt.server.id" class="d-flex align-items-center mb-4">
        <Avatar v-if="pt.server.icon" size="xlarge" :image="`${$pub.apiBaseurl}/${pt.server.icon}`"> </Avatar>
        <Avatar v-else size="xlarge"> <i class="bx bxs-server"></i> </Avatar>
        <div class="ms-4">
          <h2 class="text-uppercase m-0" v-text="pt.server.name" />
          <span v-if="pt.time" v-text="$utils.formatDuration(pt.time)" />
          <span v-else>{{ $t('cabinet.never_played') }}</span>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="d-flex align-items-center mb-3" v-for="(n, index) in 3" :key="index">
        <Skeleton size="4rem"></Skeleton>
        <div class="ms-3" style="flex: 1">
          <Skeleton width="100%" class="mb-2"></Skeleton>
          <Skeleton width="75%"></Skeleton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'cabinet.tab_stats' })

const { $api, $t } = useNuxtApp()

useHead({ title: computed(() => $t('header.cabinet')) })
const playtime = ref(null)

onMounted(async () => {
  playtime.value = await $api.get('/cabinet/playtime/me').then((res) => res.data)
})
</script>

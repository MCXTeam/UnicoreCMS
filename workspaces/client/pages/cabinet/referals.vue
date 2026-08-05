<template>
  <div>
    <section class="px-4 pb-4">
      <h2 class="mt-0 mb-3">Реферальная система</h2>
      <p><b>Реферальная система</b> – это форма сотрудничества, основанная на награждении рефереров за привлечение новых игроков.</p>
      <div class="row">
        <div class="col-xl-6">
          <h4 class="m-0">Что получаете вы?</h4>
          <div class="mini-profile p-4 my-3 h-75">
            <h2 class="mt-0 mb-2">{{ $utils.formatCurrency('real', config.public_referal_reward) }} на баланс</h2>
            <span
              >Если приглашённый вами игрок отыграет на проекте не менее
              {{
                $moment.duration(config.public_referal_trigger, 'minutes').format('y [years], w [weeks], d [days], h [hours], m [minutes]')
              }}.</span
            >
          </div>
        </div>
        <div class="col-xl-6">
          <h4 class="m-0">Что получает игрок?</h4>
          <div class="mini-profile p-4 my-3 h-75">
            <h2 class="mt-0 mb-2">{{ $utils.formatCurrency('real', config.public_referal_reward_player) }} на баланс</h2>
            <span
              >Если он отыграет на проекте не менее
              {{
                $moment.duration(config.public_referal_trigger, 'minutes').format('y [years], w [weeks], d [days], h [hours], m [minutes]')
              }}.</span
            >
          </div>
        </div>
      </div>
    </section>
    <hr />
    <section class="px-4 pb-4">
      <h2 class="mt-4 mb-3">Ваша реферальная ссылка</h2>
      <div class="row">
        <div class="col-xl-9 input-fw d-flex align-items-center">
          <InputText class="w-100" v-model="link" readonly />
        </div>
        <div class="col d-flex align-items-center">
          <Button @click="copyLink()" class="w-full" size="large" label="Копировать" />
        </div>
      </div>
      <h3 class="mb-3 mt-4">Приглашённые вами игроки</h3>
      <DataTable class="no-overflow-table large-table" :value="referals">
        <Column header="Дата">
          <template #body="{ data }"> {{ $moment(data.user.created).format('DD.MM.YYYY, HH:mm:ss') }} </template>
        </Column>
        <Column headerStyle="width: 35%" header="Логин">
          <template #body="{ data }">
            <div class="d-flex align-items-center">
              <Avatar class="rounded shadow me-3">
                <SkinView2D class="rounded" :width="32" :height="32" :skin="data.user.skin" />
              </Avatar>
              <NuxtLink :to="`/user/` + data.user.username">{{ data.user.username }}</NuxtLink>
            </div>
          </template>
        </Column>
        <Column headerStyle="width: 35%" header="Время в игре">
          <template #body="{ data }">
            {{ $moment.duration(data.playtime, 'minutes').format('y [years], w [weeks], d [days], h [hours], m [minutes]') }}
          </template>
        </Column>
        <template #empty>
          <span>Похоже, что вы ещё никого не пригласили...</span>
        </template>
      </DataTable>
    </section>
  </div>
</template>

<script>
import { useConfigStore } from '~/stores/config'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'verify'],
  title: 'Личный кабинет',
})

export default {
  setup() {
    const configStore = useConfigStore()
    return { config: computed(() => configStore.config) }
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
      this.referals = await this.$api.get('/cabinet/referals/me').then((res) => res.data)
    },

    async copyLink() {
      await navigator.clipboard.writeText(this.link)
      this.$unicore.successNotification('Ссылка скопирована в буфер обмена')
    },
  },
}
</script>

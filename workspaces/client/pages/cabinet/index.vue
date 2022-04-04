<template>
  <section>
    <div class="row px-4">
      <div class="col-xl-6 pe-xl-2">
        <div class="skin-view p-4">
          <div class="row">
            <div class="col-xxl-6 d-flex flex-column align-items-center">
              <SkinView3D class="rounded" :width="140" :height="200" :skin="$auth.user.skin" :cloak="$auth.user.cloak" ref="Skin3D" />
              <div class="skin-animation">
                <i @click="$refs.Skin3D.setAnimation(null)" class="bx bx-male"></i>
                <i @click="$refs.Skin3D.setAnimation('walk')" class="bx bx-walk"></i>
                <i @click="$refs.Skin3D.setAnimation('run')" class="bx bx-run"></i>
              </div>
            </div>
            <div class="col mt-4 mt-xxl-0">
              <div class="d-flex d-none d-xxl-flex justify-content-around skin-2d">
                <SkinView3D class="rounded" :width="75" :height="150" :skin="$auth.user.skin" :cloak="$auth.user.cloak" ref="SkinFront" />
                <SkinView3D class="rounded" :width="75" :height="150" :skin="$auth.user.skin" :cloak="$auth.user.cloak" ref="SkinBack" />
              </div>
              <div class="d-flex">
                <input type="file" ref="skin" class="d-none" @change="updateSkin()" />
                <vs-button @click="$refs.skin.click()" block :loading="skinLoading">Загрузить скин</vs-button>
                <vs-button @click="deleteSkin($event)" block danger class="w-25" :loading="skinLoading"
                  ><i class="bx bx-trash"></i
                ></vs-button>
              </div>
              <div class="d-flex">
                <input type="file" ref="cloak" class="d-none" @change="updateCloak()" />
                <vs-button @click="$refs.cloak.click()" block :loading="cloakLoading">Загрузить плащ</vs-button>
                <vs-button @click="deleteCloak($event)" block danger class="w-25" :loading="cloakLoading"
                  ><i class="bx bx-trash"></i
                ></vs-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-6 px-4 mt-4 mt-xl-0 player-info">
        <h5 class="text-uppercase mt-0 d-none d-xl-block"><b>UUID:</b> {{ $auth.user.uuid }}</h5>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="m-0">Сведения об аккаунте</h3>
          <vs-button :to="`/user/` + $auth.user.username" class="d-none d-xl-block" size="small"><i class="bx bx-link me-1"></i> Публичный профиль</vs-button>
        </div>
        <table class="player-info-table w-100">
          <tr>
            <td>Логин</td>
            <td v-text="$auth.user.username" />
          </tr>
          <tr>
            <td>Email</td>
            <td v-text="$auth.user.email || '-'" />
          </tr>
          <tr>
            <td>Регистрация</td>
            <td v-text="$moment($auth.user.created).local().format('D MMMM YYYY, HH:mm')" />
          </tr>
          <tr>
            <td>Стаж аккаунта</td>
            <td v-text="$moment.duration($moment() - $moment($auth.user.created)).format()" />
          </tr>
          <tr v-if="inviter">
            <td>Вас пригласил</td>
            <td v-text="inviter.inviter.username" />
          </tr>
        </table>
      </div>
    </div>
    <hr class="my-3" />
    <div class="row px-4">
      <div class="col-xl-8">
        <h2 class="m-0">Блокировки аккаунта</h2>
        <p>Информация об активных блокировках аккаунта, при блокировке вам недоступны некоторые разделы сайта и доступ к серверам.</p>
        <p v-if="!$auth.user.ban" class="text-success">Все круто, твой аккаунт не в бане!</p>
        <p v-if="$auth.user.ban && $auth.user.ban.expires" class="text-danger">
          Вы заблокированы до {{ $moment($auth.user.expires).local().format('DD.MM.YYYY, HH:mm:ss') }}!
        </p>
        <p v-if="$auth.user.ban && !$auth.user.ban.expires" class="text-danger">Вы заблокированы навсегда!</p>
      </div>
      <div class="col-xl-4 d-flex align-items-center">
        <vs-button block size="large" :disabled="!$auth.user.ban" :loading="banLoading" @click="unabn()">Купить разбан за {{$utils.formatCurrency(config.public_unban_price)}}</vs-button>
      </div>
    </div>
    <hr class="my-3" />
    <div class="px-4">
      <h2 class="m-0">Балансы валюты на серверах</h2>
      <p>
        Информация о балансе внутриигровой валюты на серверах. Обмен, перевод и пополненение осуществляется во вкладке
        <nuxt-link to="/cabinet/payment">“ПОПОЛНЕНИЕ И ПЕРЕВОД”</nuxt-link>
      </p>
      <div class="row mt-2" v-if="money">
        <div class="col-xl-4 d-flex align-items-center mb-3" v-for="m in money" :key="m.server.id">
          <Avatar v-if="m.server.icon" size="xlarge" :image="`${$config.apiUrl}/${m.server.icon}`"> </Avatar>
          <Avatar v-else size="xlarge"> <i class="bx bxs-server"></i> </Avatar>
          <div class="ms-3">
            <h3 class="m-0" v-text="m.server.name" />
            <span>{{ $utils.formatNumber(m.money) }} монет</span>
          </div>
        </div>
      </div>
      <div class="row mt-2" v-else>
        <div class="col-xl-4 d-flex align-items-center mb-3" v-for="(n, index) in 3" :key="index">
          <Skeleton size="4rem"></Skeleton>
          <div class="ms-3" style="flex: 1">
            <Skeleton width="100%" class="mb-2"></Skeleton>
            <Skeleton width="75%"></Skeleton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  layout: 'cabinet',

  data() {
    return {
      inviter: null,
      money: null,
      skinLoading: false,
      cloakLoading: false,
      banLoading: false,
    }
  },

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Личный кабинет')
  },

  computed: {
    ...mapGetters({
      config: 'unicore/config',
    }),
  },

  async fetch() {
    this.money = await this.$axios.get('/cabinet/money/me').then((res) => res.data)
    try {
      this.inviter = await this.$axios.get('/cabinet/referals/me/inviter').then((res) => res.data)
    } catch {}
  },

  methods: {
    async updateSkin() {
      this.skinLoading = true
      const skinData = new FormData()
      skinData.append('file', this.$refs.skin.files[0])

      try {
        await this.$axios.patch('/cabinet/skin/skin', skinData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        await this.$auth.fetchUser()
        this.$unicore.successNotification('Ваш скин был обновлён!')
      } catch (e) {
        if (e.response?.status == 415) this.$unicore.errorNotification('Файл не является скином Minecraft')
      }

      this.skinLoading = false
    },
    async updateCloak() {
      this.cloakLoading = true
      const cloakData = new FormData()
      cloakData.append('file', this.$refs.cloak.files[0])

      try {
        await this.$axios.patch('/cabinet/skin/cloak', cloakData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        await this.$auth.fetchUser()
        this.$unicore.successNotification('Ваш плащ был обновлён!')
      } catch (e) {
        if (e.response?.status == 415) this.$unicore.errorNotification('Файл не является плащом Minecraft')
      }

      this.cloakLoading = false
    },
    async deleteSkin() {
      this.skinLoading = true
      try {
        await this.$axios.delete('/cabinet/skin/skin')
        await this.$auth.fetchUser()
        this.$unicore.successNotification('Ваш скин был удалён!')
      } catch {}
      this.skinLoading = false
    },
    async deleteCloak() {
      this.cloakLoading = true
      try {
        await this.$axios.delete('/cabinet/skin/cloak')
        await this.$auth.fetchUser()
        this.$unicore.successNotification('Ваш плащ был удалён!')
      } catch {}
      this.cloakLoading = false
    },
    async unabn() {
      this.banLoading = true
      try {
        await this.$axios.post('/bans/unban')
        await this.$auth.fetchUser()
        this.$unicore.successNotification('Ваш аккаунт был разблокирован!')
      } catch {
         this.$unicore.errorNotification('На балансе недостаточно денег для покупки разбана!')
      }
      this.banLoading = false
    },
  },

  mounted() {
    this.$refs.Skin3D.viewer.playerObject.rotation.set(0, 0.3, 0)

    this.$refs.SkinFront.control.enableRotate = false

    this.$refs.SkinBack.control.enableRotate = false
    this.$refs.SkinBack.viewer.playerObject.rotation.set(0, 3.15, 0)
  },
}
</script>

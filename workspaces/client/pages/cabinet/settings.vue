<template>
  <section>
    <div class="row settings-split px-4">
      <div class="col-xl-6">
        <h2 class="mt-0 mb-2">Сменить пароль</h2>
        <p class="mt-0 mb-3">
          В целях безопасности мы рекомендуем выбрать пароль, который ещё не использовался вами в других учётных записях.
        </p>
        <ValidationObserver v-slot="{ invalid }" @submit.prevent="setPassword">
          <h3 class="mb-1 mt-0">Текущий пароль</h3>
          <ValidationProvider class="w-100" name="Текущий пароль" rules="required|min:6|max:24" v-slot="{ errors }" ref="password">
            <vs-input type="password" v-model="password_form.password_old" placeholder="Текущий пароль">
              <template #message-danger v-if="errors[0]">
                {{ errors[0] }}
              </template>
            </vs-input>
          </ValidationProvider>
          <h3 class="mb-1 mt-3">Новый пароль</h3>
          <ValidationProvider class="w-100" name="password" rules="required|min:6|max:24" v-slot="{ errors }" ref="password">
            <vs-input type="password" v-model="password_form.password" placeholder="Новый пароль">
              <template #message-danger v-if="errors[0]">
                {{ errors[0] }}
              </template>
            </vs-input>
          </ValidationProvider>
          <h3 class="mb-1 mt-3">Введите новый пароль ещё раз</h3>
          <ValidationProvider
            class="w-100"
            name="Подтверждение нового пароля"
            rules="required|confirmed:password"
            v-slot="{ errors }"
            ref="password"
          >
            <vs-input type="password" v-model="password_form.password_confirm" placeholder="Введите новый пароль ещё раз">
              <template #message-danger v-if="errors[0]">
                {{ errors[0] }}
              </template>
            </vs-input>
          </ValidationProvider>
          <vs-button :disabled="invalid" class="mt-3" size="large" block>Сменить пароль</vs-button>
        </ValidationObserver>
      </div>
      <div class="col ps-xl-5 mt-5 mt-xl-0">
        <h2 class="mb-2 mt-0">Двухфакторная авторизация</h2>
        <div v-if="!$auth.user.two_factor_enabled" v-show="two_factor && !$auth.user.two_factor_enabled">
          <div class="text-sm mini-profile p-2 my-3">
            <p class="m-0">
              Двухфакторная аутентификация не позволит злоумышленникам войти под вашим аккаунтом, даже если они узнают ваш пароль.
            </p>
            <p class="mt-1 mb-0">Эта степень защиты даст вам возможность спокойно играть не беспокоясь о безопасности вашего аккаунта.</p>
            <p class="m-0">
              Наша система поддерживает популярные приложения: <b>Google Authentificator</b>, <b>Authy</b>, <b>Яндекс.Ключ</b>. Для
              подключения загрузите приложение на свой смартфон, отсканируйте QR-код, введите код из приложения в специальное поле ниже.
            </p>
          </div>
          <p v-if="two_factor" class="m-0 text-sm">Секретный ключ: <b v-text="two_factor.base32" /></p>
          <p class="m-0 text-sm">Аккаунт: <b v-text="$auth.user.username" /></p>
          <p class="m-0 text-sm">На основе времени: <b>Да (30 секунд)</b></p>
          <div class="row mt-3">
            <div class="col-xl-5 d-flex justify-content-center mb-3 mb-xl-0">
              <canvas ref="qrcode" />
            </div>
            <div class="col">
              <ValidationObserver v-slot="{ invalid }" @submit.prevent="setPassword">
                <ValidationProvider class="w-100" name="Код из приложения" rules="required">
                  <vs-input v-model="two_factor_form.code" placeholder="Код из приложения" />
                </ValidationProvider>
                <vs-button :disabled="invalid" @click="TwoFactorEnable()" class="mt-3" size="large" block>Подключить</vs-button>
              </ValidationObserver>
            </div>
          </div>
        </div>
        <div v-else-if="$auth.user.two_factor_enabled && !two_factor">
          <p class="m-0">Статус: <b class="text-success">Подключена</b></p>
          <p class="m-0">Аккаунт: <b v-text="$auth.user.username" /></p>
          <p class="mt-0 mb-3">На основе времени: <b>Да (30 секунд)</b></p>
          <ValidationObserver v-slot="{ invalid }" @submit.prevent="setPassword">
            <ValidationProvider class="w-100" name="Код из приложения" rules="required">
              <vs-input v-model="two_factor_form.code" placeholder="Код из приложения" />
            </ValidationProvider>
            <vs-button :disabled="invalid" @click="TwoFactorDisable()" class="mt-3" size="large" block>Отключить</vs-button>
          </ValidationObserver>
        </div>
        <div v-if="!two_factor && !$auth.user.two_factor_enabled">
          <Skeleton width="100%" height="120px" class="mb-3 mt-4"></Skeleton>
          <Skeleton width="100%" class="mb-2"></Skeleton>
          <Skeleton width="100%" class="mb-2"></Skeleton>
          <Skeleton width="100%" class="mb-2"></Skeleton>
          <div class="row mt-3">
            <div class="col-xl-5 d-flex justify-content-center mb-3 mb-xl-0">
              <Skeleton size="150px"></Skeleton>
            </div>
            <div class="col">
              <Skeleton width="100%" height="25px" class="mb-2"></Skeleton>
              <Skeleton width="100%" height="25px"></Skeleton>
            </div>
          </div>
        </div>
      </div>
    </div>
    <hr />
  </section>
</template>
<script>
import QRCode from 'qrcode-with-logos'

export default {
  layout: 'cabinet',

  data() {
    return {
      password_form: {
        password_old: '',
        password: '',
        password_confirm: '',
      },
      two_factor_form: {
        code: '',
      },
      two_factor: null,
    }
  },

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Личный кабинет')
  },

  async fetch() {
    if (!this.$auth.user.two_factor_enabled) this.GenerateQR()
  },

  methods: {
    async GenerateQR() {
      this.two_factor = await this.$axios.get('/cabinet/2fa/generate').then((res) => res.data)
      await new QRCode({
        canvas: this.$refs.qrcode,
        content: this.two_factor.otpauth_url,
        logo: {
          src: '/icon.png',
        },
        width: 150,
        nodeQrCodeOptions: {
          margin: 1,
        },
      }).toImage()
    },
    async TwoFactorEnable() {
      const loading = this.$vs.loading()
      try {
        await this.$axios.post('/cabinet/2fa/enable', this.two_factor_form).then((res) => res.data)
        await this.$auth.fetchUser()
        this.two_factor_form.code = ''
        this.two_factor = null
        this.$unicore.successNotification('Двухфакторная авторизация успешно подключена к вашему аккаунту')
      } catch {
        this.$unicore.errorNotification('Код из приложения не подходит, попробуйте еще раз')
      }
      loading.close()
    },
    async TwoFactorDisable() {
      const loading = this.$vs.loading()
      try {
        await this.$axios.post('/cabinet/2fa/disable', this.two_factor_form).then((res) => res.data)
        await Promise.all([this.$auth.fetchUser(), this.GenerateQR()])
        this.two_factor_form.code = ''
        this.$unicore.successNotification('Двухфакторная авторизация успешно отключена от вашего аккаунта')
      } catch {
        this.$unicore.errorNotification('Код из приложения не подходит, попробуйте еще раз')
      }
      loading.close()
    },
  },
}
</script>

<template>
  <section>
    <ValidationObserver v-slot="{ invalid }" class="d-flex flex-column align-items-center w-100" tag="form" @submit.prevent="login">
      <h3 data-aos="zoom-in-right" data-aos-delay="150" class="text-uppercase text-center mb-4">
        Войдите в учётную запись {{ $config.name }}
      </h3>
      <div class="w-100" v-if="totpRequired">
        <p class="text-center mb-4 w-100">
          Так как для данного аккаунта включена двухфакторная авторизация, для входа в него необходимо ввести код из
          приложения-аутификатора.
        </p>
        <ValidationProvider class="w-100" name="Код из приложения" rules="required">
          <vs-input v-if="totpRequired" placeholder="Код из приложения" v-model="form.totp" class="mb-3">
            <template #icon>
              <i class="bx bx-lock-open-alt"></i>
            </template>
          </vs-input>
        </ValidationProvider>
      </div>
      <div class="w-100" v-else>
        <ValidationProvider class="w-100" name="Email" rules="required|isUsernameOrEmail" v-slot="{ errors }">
          <vs-input
            data-aos="zoom-in-right"
            data-aos-delay="300"
            placeholder="Имя пользователя или Email"
            v-model="form.username_or_email"
            class="mb-3"
          >
            <template #icon>
              <i class="bx bx-user"></i>
            </template>
            <template #message-danger v-if="errors[0]">
              {{ errors[0] }}
            </template>
          </vs-input>
        </ValidationProvider>
        <ValidationProvider class="w-100" name="Пароль" rules="required|min:6|max:32" v-slot="{ errors }">
          <vs-input data-aos="zoom-in-right" data-aos-delay="450" type="password" placeholder="Пароль" v-model="form.password">
            <template #icon>
              <i class="bx bx-lock-open-alt"></i>
            </template>
            <template #message-danger v-if="errors[0]">
              {{ errors[0] }}
            </template>
          </vs-input>
        </ValidationProvider>
        <div
          data-aos="zoom-in-right"
          data-aos-anchor="body"
          data-aos-delay="600"
          class="d-flex justify-content-between align-items-center my-3 w-100"
        >
          <vs-checkbox v-model="form.save_me">Запомнить меня</vs-checkbox>
          <vs-button to="/auth/restore" transparent>Забыли пароль?</vs-button>
        </div>
      </div>
      <div class="w-100" data-aos="zoom-in-right" data-aos-delay="750">
        <vs-button :disabled="invalid" type="submit" size="xl" block>Войти</vs-button>
      </div>
      <p data-aos="zoom-in-right" data-aos-delay="900" class="mb-0 mt-4">У вас нет учётной записи UnicoreCMS?</p>
      <nuxt-link data-aos="zoom-in-right" data-aos-delay="1050" class="mb-4" to="/auth/register">Зарегистрироваться</nuxt-link>
    </ValidationObserver>
  </section>
</template>

<script>
export default {
  layout: 'auth',
  middleware: 'guest',
  data() {
    return {
      form: {
        username_or_email: '',
        password: '',
        totp: '',
        save_me: '',
      },
      totpRequired: false,
    }
  },
  methods: {
    async login() {
      const loading = this.$vs.loading()
      const recaptcha = await this.$recaptcha.execute('login')
      try {
        await this.$auth.loginWith('local', {
          data: this.form,
          headers: { recaptcha },
        })
        loading.close()
      } catch (err) {
        loading.close()

        if (err?.response?.data?.message == 'require2fa') {
          this.totpRequired = true
        } else {
          if (this.totpRequired) {
            this.$unicore.authErrorNotification(err, `Код из приложения не подходит, попробуйте еще раз`)
          } else {
            this.$unicore.authErrorNotification(err, `Неправильный логин или пароль`)
          }
        }
      }
    },
  },
}
</script>

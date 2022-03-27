<template>
  <ValidationObserver v-slot="{ invalid }" class="d-flex flex-column align-items-center w-100" tag="form" @submit.prevent="register">
    <h3 data-aos="zoom-in-right" data-aos-delay="150" class="text-uppercase text-center mb-4">
      Регистрация учётной записи {{ $config.name }}
    </h3>
    <vs-dialog scroll overflow-hidden auto-width v-model="rules.active" :loading="!rules.title">
      <template #header>
        <h1 v-text="rules.title" />
      </template>
      <div class="m-3" v-html="rules.content" />
    </vs-dialog>

    <ValidationProvider class="w-100" name="Имя пользователя" rules="required|isUsername" v-slot="{ errors }">
      <vs-input data-aos="zoom-in-right" data-aos-delay="300" placeholder="Имя пользователя" v-model="form.username" class="mb-3">
        <template #icon>
          <i class="bx bx-user"></i>
        </template>
        <template #message-danger v-if="errors[0]">
          {{ errors[0] }}
        </template>
      </vs-input>
    </ValidationProvider>
    <ValidationProvider class="w-100" name="Email" rules="required|email" v-slot="{ errors }">
      <vs-input data-aos="zoom-in-right" data-aos-delay="450" placeholder="Email" v-model="form.email" class="mb-3">
        <template #icon>
          <i class="bx bx-mail-send"></i>
        </template>
        <template #message-danger v-if="errors[0]">
          {{ errors[0] }}
        </template>
      </vs-input>
    </ValidationProvider>
    <ValidationProvider class="w-100" name="password" rules="required|min:6|max:24" v-slot="{ errors }" ref="password">
      <vs-input data-aos="zoom-in-right" data-aos-delay="600" type="password" placeholder="Пароль" v-model="form.password" class="mb-3">
        <template #icon>
          <i class="bx bx-lock-open-alt"></i>
        </template>
        <template #message-danger v-if="errors[0]">
          {{ errors[0] }}
        </template>
      </vs-input>
    </ValidationProvider>
    <ValidationProvider
      class="w-100"
      name="Подтверждение пароля"
      rules="required|confirmed:password"
      v-slot="{ errors }"
      data-vv-as="password"
    >
      <vs-input
        data-aos="zoom-in-right"
        data-aos-delay="750"
        type="password"
        placeholder="Подтверждение пароля"
        v-model="form.password_confirm"
      >
        <template #icon>
          <i class="bx bx-lock-open-alt"></i>
        </template>
        <template #message-danger v-if="errors[0]">
          {{ errors[0] }}
        </template>
      </vs-input>
    </ValidationProvider>
    <ValidationProvider class="w-100" :rules="{ required: { allowFalse: false } }">
      <div data-aos="zoom-in-right" data-aos-delay="900" class="my-3 w-100">
        <vs-checkbox v-model="form.confirmed"
          >Я прочитал и принамаю <a @click="rules.active = true" class="mx-1">правила</a> проекта</vs-checkbox
        >
      </div>
    </ValidationProvider>
    <div class="w-100" data-aos="zoom-in-right" data-aos-delay="1050">
      <vs-button :disabled="invalid" type="submit" size="xl" block>Войти</vs-button>
    </div>
    <p data-aos="zoom-in-right" data-aos-delay="1200" class="mb-0 mt-4 d-flex align-items-center mb-4">
      Уже зарегистрированны? <nuxt-link class="ms-2" to="/auth">Войти</nuxt-link>
    </p>
  </ValidationObserver>
</template>

<script>
export default {
  layout: 'auth',
  middleware: 'guest',
  data() {
    return {
      form: {
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        confirmed: false,
      },
      rules: {
        title: null,
        content: null,
        active: false,
      },
    }
  },
  async mounted() {
    const rules = await this.$axios.get('/pages/rules').then((res) => res.data)

    this.rules.title = rules.title
    this.rules.content = rules.content
  },
  methods: {
    async register() {
      const loading = this.$vs.loading()
      try {
        const recaptcha = await this.$recaptcha.execute('register')
        const data = await this.$axios.post('/auth/register', this.form, { headers: { recaptcha } }).then((res) => res.data)
        await this.$auth.setUserToken(data.accessToken, data.refreshToken)
        loading.close()
      } catch (err) {
        loading.close()
        this.$unicore.authErrorNotification(err, `Игрок с данным именем пользователя или email уже существует`)
      }
    },
  },
}
</script>

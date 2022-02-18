<template>
  <ValidationObserver v-slot="{ invalid }" class="d-flex flex-column align-items-center w-100" tag="form" @submit.prevent="login">
    <ValidationProvider class="w-100" name="Email" rules="required|isUsernameOrEmail" v-slot="{ errors }">
      <vs-input
        data-aos="zoom-in-right"
        data-aos-delay="150"
        placeholder="Имя пользователя или Email"
        :disabled="loading"
        :loading="loading"
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
      <vs-input
        :disabled="loading"
        :loading="loading"
        data-aos="zoom-in-right"
        data-aos-delay="300"
        type="password"
        placeholder="Пароль"
        v-model="form.password"
      >
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
      data-aos-delay="450"
      class="d-flex justify-content-between align-items-center my-3 w-100"
    >
      <vs-checkbox :loading="loading" v-model="form.save_me">Запомнить меня</vs-checkbox>
      <vs-button to="/auth/restore" transparent>Забыли пароль?</vs-button>
    </div>
    <div class="w-100" data-aos="zoom-in-right" data-aos-delay="600">
      <vs-button :loading="loading" :disabled="invalid || loading" type="submit" size="xl" block>Войти</vs-button>
    </div>
    <p data-aos="zoom-in-right" data-aos-delay="750" class="mb-0 mt-4">У вас нет учётной записи UnicoreCMS?</p>
    <nuxt-link data-aos="zoom-in-right" data-aos-delay="900" class="mb-4" to="/auth/register">Зарегистрироваться</nuxt-link>
  </ValidationObserver>
</template>

<script>
import { ValidationObserver, ValidationProvider } from 'vee-validate'

export default {
  layout: 'auth',
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  data() {
    return {
      form: {
        username_or_email: '',
        password: '',
        save_me: '',
      },
      loading: false,
    }
  },
  methods: {
    async login() {
      this.loading = true
      try {
        const recaptcha = await this.$recaptcha.execute('login')
        await this.$auth.loginWith('local', {
          data: this.form,
          headers: { recaptcha },
        })
      } catch (err) {
        this.$vs.notification({
          icon: `<i class='bx bxs-bug' ></i>`,
          color: 'danger',
          position: 'top-right',
          title: 'Ошибка авторизации',
          text: `Неправельный логин или пароль`,
        })
        this.loading = false
      }
    },
  },
}
</script>
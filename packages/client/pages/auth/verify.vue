<template>
  <ValidationObserver v-slot="{ invalid }" class="d-flex flex-column align-items-center w-100" tag="form" @submit.prevent="verify">
    <h2 data-aos="zoom-in-right" data-aos-delay="150" class="text-uppercase text-center mb-2">Верификация почты</h2>
    <p data-aos="zoom-in-right" data-aos-delay="300" class="text-center mb-4">
      На указанный вами Email <b>{{ $auth.user.email }}</b> было выслано письмо с пин-кодом для подтверждения владения почтой
    </p>
    <ValidationProvider class="w-100" name="Код активации" rules="required|min:6|max:6" v-slot="{ errors }">
      <vs-input data-aos="zoom-in-right" data-aos-delay="450" placeholder="Код активации" v-model="form.code" class="mb-3">
        <template #icon>
          <i class="bx bx-lock-alt"></i>
        </template>
        <template #message-danger v-if="errors[0]">
          {{ errors[0] }}
        </template>
      </vs-input>
    </ValidationProvider>
    <div class="w-100" data-aos="zoom-in-right" data-aos-delay="600">
      <vs-button :disabled="invalid" type="submit" size="xl" block>Войти</vs-button>
    </div>
    <div data-aos="zoom-in-right" data-aos-delay="750" class="mb-4 mt-2 w-100 d-flex justify-content-around">
      <a @click="resend()">Выслать новый код</a>
      <a @click="$unicore.logout()">Выйти</a>
    </div>
  </ValidationObserver>
</template>

<script>
export default {
  middleware: ['auth', 'alter-verify'],
  layout: 'auth',
  data() {
    return {
      form: {
        code: '',
      },
    }
  },
  methods: {
    async verify() {
      const loading = this.$vs.loading()
      try {
        const user = await this.$axios.post('/auth/verify', this.form).then((res) => res.data)
        this.$auth.setUser(user)
        this.$auth.redirect('home')
        loading.close()
      } catch (err) {
        loading.close()
        this.$unicore.authErrorNotification(err, `Указанный вами пин-код является неверным`)
      }
    },
    async resend() {
      const loading = this.$vs.loading()
      try {
        await this.$axios.get('/auth/resend')
        loading.close()
        this.$unicore.successNotification('Мы выслали вам новый пин-код, пожалуйста проверьте вашу почту')
      } catch (err) {
        loading.close()
        this.$unicore.errorNotification('Слишком много запросов, подождите пару минут...')
      }
    },
  },
}
</script>

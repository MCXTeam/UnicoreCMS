<template>
  <section>
    <vs-dialog scroll overflow-hidden auto-width v-model="modal" prevent-close not-close>
      <template #header>
        <h1>Восстановление доступа</h1>
      </template>
      <div class="m-3 text-center">
        На указанный вами адрес электронной почты ({{ form.email }}) было высланно письмо с ссылкой для продолжения процедуры восстановления
        доступа.
      </div>
    </vs-dialog>
    <ValidationObserver v-slot="{ invalid }" class="d-flex flex-column align-items-center w-100" tag="form" @submit.prevent="reset">
      <h3 data-aos="zoom-in-right" data-aos-delay="150" class="text-uppercase text-center mb-4">Забыли пароль?</h3>
      <div class="">
        <p class="text-center mb-4 w-100"></p>
      </div>
      <div class="w-100">
        <p class="text-center mb-4 w-100">
          Введите адрес электронной почты, который был использован для регистрации. Ваб будет выслано письмо с дальнейшими инструкциями по
          сбросу пароля.
        </p>
        <ValidationProvider class="w-100" name="Email" rules="required|email" v-slot="{ errors }">
          <vs-input data-aos="zoom-in-right" data-aos-delay="300" placeholder="Email" v-model="form.email" class="mb-3">
            <template #icon>
              <i class="bx bx-mail-send"></i>
            </template>
            <template #message-danger v-if="errors[0]">
              {{ errors[0] }}
            </template>
          </vs-input>
        </ValidationProvider>
      </div>
      <div class="w-100" data-aos="zoom-in-right" data-aos-delay="450">
        <vs-button :disabled="invalid" type="submit" size="xl" block>Отправить письмо</vs-button>
      </div>
      <p data-aos="zoom-in-right" data-aos-delay="600" class="mb-0 mt-4 d-flex align-items-center mb-4">
        Помните свой пароль? <nuxt-link class="ms-2" to="/auth">Войти</nuxt-link>
      </p>
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
        email: '',
      },
      modal: false,
    }
  },

  methods: {
    async reset() {
      const loading = this.$vs.loading()
      try {
        await this.$axios.post('/auth/reset', this.form)
        loading.close()
        this.modal = true
      } catch {
        loading.close()
        this.$unicore.errorNotification(`Игрока с данным email не существует`)
      }
    },
  },
}
</script>

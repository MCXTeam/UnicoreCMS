<template>
  <ValidationObserver v-slot="{ invalid }" class="d-flex flex-column align-items-center w-100" tag="form" @submit.prevent="reset">
    <h3 data-aos="zoom-in-right" data-aos-delay="150" class="text-uppercase text-center mb-4">Восстановление пароля</h3>
    <ValidationProvider class="w-100" name="password" rules="required|min:6|max:24" v-slot="{ errors }" ref="password">
      <vs-input
        data-aos="zoom-in-right"
        data-aos-delay="300"
        type="password"
        placeholder="Новый пароль"
        v-model="form.password"
        class="mb-3"
      >
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
        data-aos-delay="450"
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
      <div data-aos="zoom-in-right" data-aos-delay="600" class="my-3 w-100">
        <vs-checkbox v-model="form.close">Завершить все сеансы?</vs-checkbox>
      </div>
    </ValidationProvider>
    <div class="w-100" data-aos="zoom-in-right" data-aos-delay="750">
      <vs-button :disabled="invalid" type="submit" size="xl" block>Сменить пароль</vs-button>
    </div>
    <p data-aos="zoom-in-right" data-aos-delay="900" class="mb-0 mt-4 d-flex align-items-center mb-4">
      Помните свой пароль? <nuxt-link class="ms-2" to="/auth">Войти</nuxt-link>
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
        password: '',
        password_confirm: '',
        close: true
      }
    }
  },
  async fetch() {
    try {
      await this.$axios.post('/auth/password', { hash: this.$route.query.hash })
    } catch {
      this.$unicore.errorNotification(`Невалидная ссылка, либо время на сброс пароля по данной ссылке истекло`)
      this.$router.push('/auth')
    }
  },
  methods: {
    async reset() {
      const loading = this.$vs.loading()
      try {
        await this.$axios.post('/auth/password', { ...this.form, hash: this.$route.query.hash })
        loading.close()
        this.$unicore.successNotification(`Пароль успешно изменён, войдите в ваш аккаунт`)
        this.$router.push('/auth')
      } catch {
        loading.close()
        this.$unicore.errorNotification(`Невалидная ссылка, либо время на сброс пароля по данной ссылке истекло`)
        this.$router.push('/auth')
      }
    },
  },
}
</script>

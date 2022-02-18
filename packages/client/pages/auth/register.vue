<template>
  <div class="d-flex flex-column align-items-center w-100">
    <vs-input data-aos="zoom-in-right" data-aos-delay="150" placeholder="Имя пользователя" v-model="form.username" class="mb-3">
      <template #icon>
        <i class="bx bx-user"></i>
      </template>
    </vs-input>
    <vs-input data-aos="zoom-in-right" data-aos-delay="300" placeholder="Email" v-model="form.email" class="mb-3">
      <template #icon>
        <i class="bx bx-mail-send"></i>
      </template>
    </vs-input>
    <vs-input data-aos="zoom-in-right" data-aos-delay="450" type="password" placeholder="Пароль" v-model="form.password" class="mb-3">
      <template #icon>
        <i class="bx bx-lock-open-alt"></i>
      </template>
    </vs-input>
    <vs-input data-aos="zoom-in-right" data-aos-delay="600" type="password" placeholder="Подтверждение пароля" v-model="form.password_confirm">
      <template #icon>
        <i class="bx bx-lock-open-alt"></i>
      </template>
    </vs-input>
    <div data-aos="zoom-in-right" data-aos-delay="750" class="my-3 w-100">
      <vs-checkbox v-model="form.confirmed">Я прочитал и принамаю правила проекта</vs-checkbox>
    </div>
    <vs-button data-aos="zoom-in-right" data-aos-delay="900" to="/start" size="xl" block>Войти</vs-button>
    <p data-aos="zoom-in-right" data-aos-delay="1050" class="mb-0 mt-4 d-flex align-items-center mb-4">
      Уже зарегистрированны? <nuxt-link class="ms-2" to="/auth">Войти</nuxt-link>
    </p>
  </div>
</template>

<script>
export default {
  layout: 'auth',
  data() {
    return {
      form: {
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        confirmed: false,
      },
    }
  },
}
</script>
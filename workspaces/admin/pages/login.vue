<template>
  <div
    class="h-full w-full m-0 py-7 px-4"
    style="border-radius: 53px; background: linear-gradient(180deg, var(--surface-50) 38.9%, var(--surface-0))"
  >
    <div class="text-center mb-5">
      <div class="text-900 text-3xl font-medium mb-3">Добро пожаловать!</div>
      <span class="text-600 font-medium">Войдите, чтобы продолжить</span>
    </div>

    <ValidationObserver v-slot="{ invalid }">
      <form @submit.prevent="Login" class="w-full md:w-10 mx-auto">
        <ValidationProvider name="Email" rules="required|isUsernameOrEmail" v-slot="{ errors }">
          <div class="field p-fluid mb-3">
            <label for="email1" class="block text-900 text-xl font-medium mb-2">Email или логин</label>
            <InputText
              id="email1"
              :disabled="disabled"
              v-model="login.username_or_email"
              type="text"
              class="w-full"
              :class="errors[0] && 'p-invalid'"
              placeholder="Email или логин"
              style="padding: 1rem"
            />
            <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
          </div>
        </ValidationProvider>
        <ValidationProvider name="Пароль" rules="required|min:6|max:32" v-slot="{ errors }">
          <div class="field p-fluid mb-3">
            <label for="password1" class="block text-900 font-medium text-xl mb-2">Пароль</label>
            <Password
              :feedback="false"
              id="password1"
              :disabled="disabled"
              v-model="login.password"
              placeholder="Пароль"
              :toggleMask="true"
              class="w-full"
              :class="errors[0] && 'p-invalid'"
              inputClass="w-full"
              inputStyle="padding:1rem"
            ></Password>
            <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
          </div>
        </ValidationProvider>
        <Button :disabled="loading || invalid" type="submit" label="Войти" class="w-full p-3 text-xl mt-5"></Button>
      </form>
    </ValidationObserver>

    <ValidationObserver v-slot="{ invalid }">
      <Dialog
        :visible.sync="totpRequired"
        :closable="false"
        :closeOnEscape="false"
        :style="{ width: '450px' }"
        :modal="true"
        header="Двухфакторная аутификация"
        class="p-fluid"
      >
        <ValidationProvider name="Код из приложения" rules="required|min:0" v-slot="{ errors }">
          <div class="field">
            <label>Код из приложения</label>
            <InputText v-model="login.totp" autofocus />
            <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
          </div>
        </ValidationProvider>
        <template #footer>
          <Button
            :disabled="invalid"
            label="Войти"
            icon="pi pi-check"
            class="p-button-text"
            @click="Login()"
          />
        </template>
      </Dialog>
    </ValidationObserver>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider } from 'vee-validate'

export default {
  layout: 'auth',
  head: {
    title: 'Авторизация',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  data() {
    return {
      disabled: false,
      loading: false,
      login: {
        username_or_email: '',
        password: '',
        totp: null
      },
      totpRequired: false,
    }
  },
  async mounted() {
    try {
      await this.$recaptcha.init()
    } catch (e) {
      console.error(e)
    }
  },
  beforeDestroy() {
    this.$recaptcha.destroy()
  },
  methods: {
    async Login() {
      this.loading = true
      try {
        const recaptcha = await this.$recaptcha.execute('login')
        await this.$auth.loginWith('local', {
          data: this.login,
          headers: { recaptcha },
        })
      } catch (err) {
        if (err?.response?.data?.message == 'require2fa') {
          this.totpRequired = true
        } else {
          if (this.totpRequired) {
            this.$toast.add({
              severity: 'error',
              summary: 'Ошибка авторизации',
              detail: 'Код из приложения не подходит, попробуйте еще раз',
              life: 3000,
            })
          } else {
            this.$toast.add({
              severity: 'error',
              summary: 'Ошибка авторизации',
              detail: 'Неправельный логин или пароль',
              life: 3000,
            })
          }
        }
        this.loading = false
      }
    },
  },
}
</script>

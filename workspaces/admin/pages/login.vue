<template>
  <div
    class="h-full w-full m-0 py-7 px-4"
    style="border-radius: 53px; background: linear-gradient(180deg, var(--surface-50) 38.9%, var(--surface-0))"
  >
    <div class="text-center mb-5">
      <div class="text-900 text-3xl font-medium mb-3">Добро пожаловать!</div>
      <span class="text-600 font-medium">Войдите, чтобы продолжить</span>
    </div>

    <Form @submit="Login" v-slot="{ meta }" class="w-full md:w-10 mx-auto">
      <Field
        v-model="login.username_or_email"
        name="username_or_email"
        label="Email или логин"
        rules="required|isUsernameOrEmail"
        v-slot="{ value, errorMessage, handleChange, handleBlur }"
      >
        <div class="field p-fluid mb-3">
          <label for="email1" class="block text-900 text-xl font-medium mb-2">Email или логин</label>
          <InputText
            id="email1"
            :disabled="disabled"
            :modelValue="value"
            @update:modelValue="handleChange"
            @blur="handleBlur"
            type="text"
            class="w-full"
            :class="errorMessage && 'p-invalid'"
            placeholder="Email или логин"
            style="padding: 1rem"
          />
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </div>
      </Field>
      <Field
        v-model="login.password"
        name="password"
        label="Пароль"
        rules="required|min:6|max:32"
        v-slot="{ value, errorMessage, handleChange, handleBlur }"
      >
        <div class="field p-fluid mb-3">
          <label for="password1" class="block text-900 font-medium text-xl mb-2">Пароль</label>
          <Password
            :feedback="false"
            id="password1"
            :disabled="disabled"
            :modelValue="value"
            @update:modelValue="handleChange"
            @blur="handleBlur"
            placeholder="Пароль"
            :toggleMask="true"
            class="w-full"
            :class="errorMessage && 'p-invalid'"
            inputClass="w-full"
            inputStyle="padding:1rem"
          ></Password>
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </div>
      </Field>
      <Button :disabled="loading || !meta.valid" type="submit" label="Войти" class="w-full p-3 text-xl mt-5"></Button>

      <Dialog
        v-model:visible="totpRequired"
        :closable="false"
        :closeOnEscape="false"
        :style="{ width: '450px' }"
        :modal="true"
        header="Двухфакторная аутификация"
        class="p-fluid"
      >
        <Field
          v-model="login.totp"
          name="totp"
          label="Код из приложения"
          rules="required"
          v-slot="{ value, errorMessage, handleChange, handleBlur }"
        >
          <div class="field">
            <label>Код из приложения</label>
            <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" autofocus />
            <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
          </div>
        </Field>
        <template #footer>
          <Button :disabled="loading" label="Войти" icon="pi pi-check" class="p-button-text" @click="Login" />
        </template>
      </Dialog>
    </Form>
  </div>
</template>

<script setup>
import { Form, Field } from 'vee-validate'
import { useReCaptcha } from 'vue-recaptcha-v3'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Авторизация' })

const authStore = useAuthStore()
const toast = useToast()
const recaptcha = useReCaptcha()
const { $api } = useNuxtApp()

const disabled = ref(false)
const loading = ref(false)
const totpRequired = ref(false)
const login = reactive({
  username_or_email: '',
  password: '',
  totp: null,
})

async function Login() {
  loading.value = true
  try {
    await recaptcha?.recaptchaLoaded?.()
    const token = await recaptcha?.executeRecaptcha?.('login')
    const { data } = await $api.post('/auth/login', login, { headers: { recaptcha: token } })
    authStore.setTokens(data.accessToken, data.refreshToken)
    authStore.setUser(data.user)
    await navigateTo('/')
  } catch (err) {
    if (err?.response?.data?.message === 'require2fa') {
      totpRequired.value = true
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка авторизации',
        detail: totpRequired.value ? 'Код из приложения не подходит, попробуйте еще раз' : 'Неправильный логин или пароль',
        life: 3000,
      })
    }
  } finally {
    loading.value = false
  }
}
</script>

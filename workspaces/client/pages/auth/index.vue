<template>
  <section>
    <Form v-slot="{ meta }" class="d-flex flex-column align-items-center w-100" @submit="login">
      <h3 data-aos="zoom-in-right" data-aos-delay="150" class="text-uppercase text-center mb-4">
        Войдите в учётную запись {{ $pub.sitename }}
      </h3>
      <div class="w-100" v-if="totpRequired">
        <p class="text-center mb-4 w-100">
          Так как для данного аккаунта включена двухфакторная авторизация, для входа в него необходимо ввести код из
          приложения-аутификатора.
        </p>
        <Field v-model="form.totp" name="Код из приложения" rules="required" v-slot="{ value, errorMessage, handleChange, handleBlur }">
          <IconField class="w-100 mb-3">
            <InputIcon class="bx bx-lock-open-alt" />
            <InputText
              :modelValue="value"
              @update:modelValue="handleChange"
              @blur="handleBlur"
              placeholder="Код из приложения"
              class="w-100"
              :class="errorMessage && 'p-invalid'"
            />
          </IconField>
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </Field>
      </div>
      <div class="w-100" v-else>
        <Field
          v-model="form.username_or_email"
          name="Email"
          rules="required|isUsernameOrEmail"
          v-slot="{ value, errorMessage, handleChange, handleBlur }"
        >
          <IconField data-aos="zoom-in-right" data-aos-delay="300" class="w-100 mb-3">
            <InputIcon class="bx bx-user" />
            <InputText
              :modelValue="value"
              @update:modelValue="handleChange"
              @blur="handleBlur"
              placeholder="Имя пользователя или Email"
              class="w-100"
              :class="errorMessage && 'p-invalid'"
            />
          </IconField>
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </Field>
        <Field
          v-model="form.password"
          name="Пароль"
          rules="required"
          v-slot="{ value, errorMessage, handleChange, handleBlur }"
        >
          <div data-aos="zoom-in-right" data-aos-delay="450" class="w-100">
            <Password
              :modelValue="value"
              @update:modelValue="handleChange"
              @blur="handleBlur"
              :feedback="false"
              :toggleMask="true"
              placeholder="Пароль"
              class="w-100"
              inputClass="w-100"
              :class="errorMessage && 'p-invalid'"
            />
          </div>
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </Field>
        <div
          data-aos="zoom-in-right"
          data-aos-anchor="body"
          data-aos-delay="600"
          class="d-flex justify-content-between align-items-center my-3 w-100"
        >
          <div class="d-flex align-items-center gap-2">
            <Checkbox v-model="form.save_me" :binary="true" inputId="save_me" />
            <label for="save_me">Запомнить меня</label>
          </div>
          <NuxtLink to="/auth/reset">Забыли пароль?</NuxtLink>
        </div>
      </div>
      <div class="w-100" data-aos="zoom-in-right" data-aos-delay="750">
        <Button :disabled="!meta.valid" type="submit" size="large" label="Войти" class="w-100" />
      </div>
      <p data-aos="zoom-in-right" data-aos-delay="900" class="mb-0 mt-4">У вас нет учётной записи UnicoreCMS?</p>
      <NuxtLink data-aos="zoom-in-right" data-aos-delay="1050" class="mb-4" to="/auth/register">Зарегистрироваться</NuxtLink>
    </Form>
  </section>
</template>

<script setup lang="ts">
import { Form, Field } from 'vee-validate'
import { useReCaptcha } from 'vue-recaptcha-v3'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { $unicore, $auth } = useNuxtApp()
const recaptcha = useReCaptcha()

const totpRequired = ref(false)
const form = reactive({
  username_or_email: '',
  password: '',
  totp: '',
  save_me: false,
})

async function login() {
  const loading = $unicore.loading()
  try {
    await recaptcha?.recaptchaLoaded?.()
    const token = await recaptcha?.executeRecaptcha?.('login')
    await $auth.login(form, { headers: { recaptcha: token } })
    await navigateTo('/cabinet')
  } catch (err: any) {
    if (err?.response?.data?.message == 'require2fa') {
      totpRequired.value = true
    } else if (totpRequired.value) {
      $unicore.authErrorNotification(err, 'Код из приложения не подходит, попробуйте еще раз')
    } else {
      $unicore.authErrorNotification(err, 'Неправильный логин или пароль')
    }
  } finally {
    loading.close()
  }
}
</script>

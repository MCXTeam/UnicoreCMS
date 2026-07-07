<template>
  <Form v-slot="{ meta }" class="d-flex flex-column align-items-center w-100" @submit="register">
    <h3 data-aos="zoom-in-right" data-aos-delay="150" class="text-uppercase text-center mb-4">
      Регистрация учётной записи {{ $pub.sitename }}
    </h3>
    <Dialog v-model:visible="rules.active" modal dismissableMask :header="rules.title || ''" :style="{ width: '50rem' }">
      <div class="m-3" v-html="$sanitize(rules.content)" />
    </Dialog>

    <Field
      v-model="form.username"
      name="Имя пользователя"
      rules="required|isUsername"
      v-slot="{ value, errorMessage, handleChange, handleBlur }"
    >
      <IconField data-aos="zoom-in-right" data-aos-delay="300" class="w-100 mb-3">
        <InputIcon class="bx bx-user" />
        <InputText
          :modelValue="value"
          @update:modelValue="handleChange"
          @blur="handleBlur"
          placeholder="Имя пользователя"
          class="w-100"
          :class="errorMessage && 'p-invalid'"
        />
      </IconField>
      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
    </Field>
    <Field v-model="form.email" name="Email" rules="required|email" v-slot="{ value, errorMessage, handleChange, handleBlur }">
      <IconField data-aos="zoom-in-right" data-aos-delay="450" class="w-100 mb-3">
        <InputIcon class="bx bx-mail-send" />
        <InputText
          :modelValue="value"
          @update:modelValue="handleChange"
          @blur="handleBlur"
          placeholder="Email"
          class="w-100"
          :class="errorMessage && 'p-invalid'"
        />
      </IconField>
      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
    </Field>
    <Field v-model="form.password" name="password" rules="required|min:6|max:24" v-slot="{ value, errorMessage, handleChange, handleBlur }">
      <Password
        data-aos="zoom-in-right"
        data-aos-delay="600"
        :modelValue="value"
        @update:modelValue="handleChange"
        @blur="handleBlur"
        :feedback="false"
        :toggleMask="true"
        placeholder="Пароль"
        class="w-100 mb-3"
        inputClass="w-100"
        :class="errorMessage && 'p-invalid'"
      />
      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
    </Field>
    <Field
      v-model="form.password_confirm"
      name="Подтверждение пароля"
      rules="required|confirmed:@password"
      v-slot="{ value, errorMessage, handleChange, handleBlur }"
    >
      <Password
        data-aos="zoom-in-right"
        data-aos-delay="750"
        :modelValue="value"
        @update:modelValue="handleChange"
        @blur="handleBlur"
        :feedback="false"
        :toggleMask="true"
        placeholder="Подтверждение пароля"
        class="w-100"
        inputClass="w-100"
        :class="errorMessage && 'p-invalid'"
      />
      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
    </Field>
    <Field v-model="form.confirmed" name="Правила" :rules="rulesAccepted" v-slot="{ value, handleChange }">
      <div data-aos="zoom-in-right" data-aos-delay="900" class="my-3 w-100">
        <div class="d-flex align-items-center gap-2">
          <Checkbox :modelValue="value" @update:modelValue="handleChange" :binary="true" inputId="rules_accept" />
          <label for="rules_accept">Я прочитал и принимаю <a @click="rules.active = true" class="mx-1">правила</a> проекта</label>
        </div>
      </div>
    </Field>
    <div class="w-100" data-aos="zoom-in-right" data-aos-delay="1050">
      <Button :disabled="!meta.valid" type="submit" size="large" label="Зарегистрироваться" class="w-100" />
    </div>
    <p data-aos="zoom-in-right" data-aos-delay="1200" class="mb-0 mt-4 d-flex align-items-center mb-4">
      Уже зарегистрированны? <NuxtLink class="ms-2" to="/auth">Войти</NuxtLink>
    </p>
  </Form>
</template>

<script setup lang="ts">
import { Form, Field } from 'vee-validate'
import { useReCaptcha } from 'vue-recaptcha-v3'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { $unicore, $auth, $api } = useNuxtApp()
const recaptcha = useReCaptcha()

const form = reactive({
  username: '',
  email: '',
  password: '',
  password_confirm: '',
  confirmed: false,
})

const rules = reactive({
  title: null as string | null,
  content: null as string | null,
  active: false,
})

const rulesAccepted = (value: unknown) => value === true || 'Необходимо принять правила проекта'

onMounted(async () => {
  const { data } = await $api.get('/pages/rules')
  rules.title = data.title
  rules.content = data.content
})

async function register() {
  const loading = $unicore.loading()
  try {
    await recaptcha?.recaptchaLoaded?.()
    const token = await recaptcha?.executeRecaptcha?.('register')
    const { data } = await $api.post('/auth/register', { ...form, ref: localStorage.getItem('ref') }, { headers: { recaptcha: token } })
    $auth.setTokens(data.accessToken, data.refreshToken)
    await $auth.fetchUser()
    await navigateTo('/cabinet')
  } catch (err: any) {
    $unicore.authErrorNotification(err, 'Игрок с данным именем пользователя или email уже существует')
  } finally {
    loading.close()
  }
}
</script>

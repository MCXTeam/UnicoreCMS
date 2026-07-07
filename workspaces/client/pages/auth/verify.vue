<template>
  <Form v-slot="{ meta }" class="d-flex flex-column align-items-center w-100" @submit="verify">
    <h2 data-aos="zoom-in-right" data-aos-delay="150" class="text-uppercase text-center mb-2">Верификация почты</h2>
    <p data-aos="zoom-in-right" data-aos-delay="300" class="text-center mb-4">
      На указанный вами Email <b>{{ auth.user?.email }}</b> было выслано письмо с пин-кодом для подтверждения владения почтой
    </p>
    <Field v-model="form.code" name="Код активации" rules="required|min:6|max:6" v-slot="{ value, errorMessage, handleChange, handleBlur }">
      <IconField data-aos="zoom-in-right" data-aos-delay="450" class="w-100 mb-3">
        <InputIcon class="bx bx-lock-alt" />
        <InputText
          :modelValue="value"
          @update:modelValue="handleChange"
          @blur="handleBlur"
          placeholder="Код активации"
          class="w-100"
          :class="errorMessage && 'p-invalid'"
        />
      </IconField>
      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
    </Field>
    <div class="w-100" data-aos="zoom-in-right" data-aos-delay="600">
      <Button :disabled="!meta.valid" type="submit" size="large" label="Войти" class="w-100" />
    </div>
    <div data-aos="zoom-in-right" data-aos-delay="750" class="mb-4 mt-2 w-100 d-flex justify-content-around">
      <a @click="resend()">Выслать новый код</a>
      <a @click="$unicore.logout()">Выйти</a>
    </div>
  </Form>
</template>

<script setup lang="ts">
import { Form, Field } from 'vee-validate'
import { useReCaptcha } from 'vue-recaptcha-v3'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'auth', middleware: 'auth' })

const { $unicore, $api } = useNuxtApp()
const auth = useAuthStore()
const recaptcha = useReCaptcha()

const form = reactive({
  code: '',
})

onMounted(() => {
  if (auth.user?.activated) navigateTo('/cabinet')
})

async function verify() {
  const loading = $unicore.loading()
  try {
    await recaptcha?.recaptchaLoaded?.()
    const token = await recaptcha?.executeRecaptcha?.('verify')
    const { data } = await $api.post('/auth/verify', form, { headers: { recaptcha: token } })
    auth.setUser(data)
    await navigateTo('/cabinet')
  } catch (err: any) {
    $unicore.authErrorNotification(err, 'Указанный вами пин-код является неверным')
  } finally {
    loading.close()
  }
}

async function resend() {
  const loading = $unicore.loading()
  try {
    await $api.get('/auth/resend')
    $unicore.successNotification('Мы выслали вам новый пин-код, пожалуйста проверьте вашу почту')
  } catch {
    $unicore.errorNotification('Слишком много запросов, подождите пару минут...')
  } finally {
    loading.close()
  }
}
</script>

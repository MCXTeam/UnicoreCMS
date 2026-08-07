<template>
  <section>
    <Form v-slot="{ meta }" class="d-flex flex-column align-items-center w-100" @submit="login">
      <h3 data-aos="zoom-in-right" data-aos-delay="150" class="text-uppercase text-center mb-4">
        {{ $t('auth.login_title', { sitename: $pub.sitename }) }}
      </h3>
      <div class="w-100" v-if="totpRequired">
        <p class="text-center mb-4 w-100">{{ $t('auth.totp_hint') }}</p>
        <Field v-model="form.totp" :name="$t('auth.totp_code')" rules="required" v-slot="{ value, errorMessage, handleChange, handleBlur }">
          <IconField class="w-100 mb-3">
            <InputIcon class="bx bx-lock-open-alt" />
            <InputText
              :modelValue="value"
              @update:modelValue="handleChange"
              @blur="handleBlur"
              :placeholder="$t('auth.totp_code')"
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
          :name="$t('auth.username_or_email')"
          rules="required|isUsernameOrEmail"
          v-slot="{ value, errorMessage, handleChange, handleBlur }"
        >
          <IconField data-aos="zoom-in-right" data-aos-delay="300" class="w-100 mb-3">
            <InputIcon class="bx bx-user" />
            <InputText
              :modelValue="value"
              @update:modelValue="handleChange"
              @blur="handleBlur"
              :placeholder="$t('auth.username_or_email')"
              class="w-100"
              :class="errorMessage && 'p-invalid'"
            />
          </IconField>
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </Field>
        <Field
          v-model="form.password"
          :name="$t('auth.password')"
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
              :placeholder="$t('auth.password')"
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
            <label for="save_me">{{ $t('auth.remember_me') }}</label>
          </div>
          <NuxtLink to="/auth/reset">{{ $t('auth.forgot_password') }}</NuxtLink>
        </div>
      </div>
      <div class="w-100" data-aos="zoom-in-right" data-aos-delay="750">
        <Button :disabled="!meta.valid" type="submit" size="large" :label="$t('header.login')" class="w-100" />
      </div>
      <p data-aos="zoom-in-right" data-aos-delay="900" class="mb-0 mt-4">{{ $t('auth.no_account', { sitename: $pub.sitename }) }}</p>
      <NuxtLink data-aos="zoom-in-right" data-aos-delay="1050" class="mb-4" to="/auth/register">
        {{ $t('auth.sign_up') }}
      </NuxtLink>
    </Form>
  </section>
</template>

<script setup lang="ts">
import { Form, Field } from 'vee-validate'
import { useReCaptcha } from 'vue-recaptcha-v3'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { $unicore, $auth, $t } = useNuxtApp()
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
      $unicore.authErrorNotification(err, $t('auth.totp_wrong'))
    } else {
      $unicore.authErrorNotification(err, $t('auth.wrong_credentials'))
    }
  } finally {
    loading.close()
  }
}
</script>

<template>
  <div
    class="h-full w-full m-0 py-7 px-4"
    style="border-radius: 53px; background: linear-gradient(180deg, var(--surface-50) 38.9%, var(--surface-0))"
  >
    <div class="text-center mb-5">
      <div class="text-900 text-3xl font-medium mb-3">{{ $t('admin.login_welcome') }}</div>
      <span class="text-600 font-medium">{{ $t('admin.login_subtitle') }}</span>
    </div>

    <Form @submit="Login" v-slot="{ meta }" class="w-full md:w-10 mx-auto">
      <Field
        v-model="login.username_or_email"
        name="username_or_email"
        :label="$t('auth.username_or_email')"
        rules="required|isUsernameOrEmail"
        v-slot="{ value, errorMessage, handleChange, handleBlur }"
      >
        <div class="field p-fluid mb-3">
          <label for="email1" class="block text-900 text-xl font-medium mb-2">{{ $t('auth.username_or_email') }}</label>
          <InputText
            id="email1"
            :disabled="disabled"
            :modelValue="value"
            @update:modelValue="handleChange"
            @blur="handleBlur"
            type="text"
            class="w-full"
            :class="errorMessage && 'p-invalid'"
            :placeholder="$t('auth.username_or_email')"
            style="padding: 1rem"
          />
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </div>
      </Field>
      <Field
        v-model="login.password"
        name="password"
        :label="$t('auth.password')"
        rules="required"
        v-slot="{ value, errorMessage, handleChange, handleBlur }"
      >
        <div class="field p-fluid mb-3">
          <label for="password1" class="block text-900 font-medium text-xl mb-2">{{ $t('auth.password') }}</label>
          <Password
            :feedback="false"
            id="password1"
            :disabled="disabled"
            :modelValue="value"
            @update:modelValue="handleChange"
            @blur="handleBlur"
            :placeholder="$t('auth.password')"
            :toggleMask="true"
            class="w-full"
            :class="errorMessage && 'p-invalid'"
            inputClass="w-full"
            inputStyle="padding:1rem"
          ></Password>
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </div>
      </Field>
      <Button :disabled="loading || !meta.valid" type="submit" :label="$t('header.login')" class="w-full p-3 text-xl mt-5"></Button>

      <Dialog
        v-model:visible="totpRequired"
        :closable="false"
        :closeOnEscape="false"
        :style="{ width: '450px' }"
        :modal="true"
        :header="$t('cabinet.two_factor')"
        class="p-fluid"
      >
        <Field
          v-model="login.totp"
          name="totp"
          :label="$t('auth.totp_code')"
          rules="required"
          v-slot="{ value, errorMessage, handleChange, handleBlur }"
        >
          <div class="field">
            <label>{{ $t('auth.totp_code') }}</label>
            <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" autofocus />
            <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
          </div>
        </Field>
        <template #footer>
          <Button :disabled="loading" :label="$t('header.login')" icon="pi pi-check" class="p-button-text" @click="Login" />
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

const authStore = useAuthStore()
const toast = useToast()
const recaptcha = useReCaptcha()
const { $api, $t } = useNuxtApp()

useHead({ title: computed(() => $t('panel.auth')) })

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
    authStore.adopt(data)
    await navigateTo('/')
  } catch (err) {
    if (err?.response?.data?.message === 'require2fa') {
      totpRequired.value = true
    } else {
      toast.add({
        severity: 'error',
        summary: $t('error.auth_title'),
        detail: totpRequired.value ? $t('auth.totp_wrong') : $t('auth.wrong_credentials'),
        life: 3000,
      })
    }
  } finally {
    loading.value = false
  }
}
</script>

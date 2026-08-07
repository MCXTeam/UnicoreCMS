<template>
  <Form v-slot="{ meta }" class="d-flex flex-column align-items-center w-100" @submit="register">
    <h3 data-aos="zoom-in-right" data-aos-delay="150" class="text-uppercase text-center mb-4">
      {{ $t('auth.register_title', { sitename: $pub.sitename }) }}
    </h3>
    <Dialog v-model:visible="rules.active" modal dismissableMask :header="rules.title || ''" :style="{ width: '50rem' }">
      <div class="m-3" v-html="$sanitize(rules.content)" />
    </Dialog>

    <Field
      v-model="form.username"
      :name="$t('auth.username')"
      rules="required|isUsername"
      v-slot="{ value, errorMessage, handleChange, handleBlur }"
    >
      <IconField data-aos="zoom-in-right" data-aos-delay="300" class="w-100 mb-3">
        <InputIcon class="bx bx-user" />
        <InputText
          :modelValue="value"
          @update:modelValue="handleChange"
          @blur="handleBlur"
          :placeholder="$t('auth.username')"
          class="w-100"
          :class="errorMessage && 'p-invalid'"
        />
      </IconField>
      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
    </Field>
    <Field v-model="form.email" :name="$t('auth.email')" rules="required|email" v-slot="{ value, errorMessage, handleChange, handleBlur }">
      <IconField data-aos="zoom-in-right" data-aos-delay="450" class="w-100 mb-3">
        <InputIcon class="bx bx-mail-send" />
        <InputText
          :modelValue="value"
          @update:modelValue="handleChange"
          @blur="handleBlur"
          :placeholder="$t('auth.email')"
          class="w-100"
          :class="errorMessage && 'p-invalid'"
        />
      </IconField>
      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
    </Field>
    <Field
      v-model="form.password"
      name="password"
      rules="required|min:8|max:128"
      v-slot="{ value, errorMessage, handleChange, handleBlur }"
    >
      <div data-aos="zoom-in-right" data-aos-delay="600" class="w-100 mb-3">
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
    <Field
      v-model="form.password_confirm"
      :name="$t('auth.password_confirm')"
      rules="required|confirmed:@password"
      v-slot="{ value, errorMessage, handleChange, handleBlur }"
    >
      <div data-aos="zoom-in-right" data-aos-delay="750" class="w-100">
        <Password
          :modelValue="value"
          @update:modelValue="handleChange"
          @blur="handleBlur"
          :feedback="false"
          :toggleMask="true"
          :placeholder="$t('auth.password_confirm')"
          class="w-100"
          inputClass="w-100"
          :class="errorMessage && 'p-invalid'"
        />
      </div>
      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
    </Field>
    <Field v-model="form.confirmed" :name="$t('auth.rules')" :rules="rulesAccepted" v-slot="{ value, handleChange }">
      <div data-aos="zoom-in-right" data-aos-delay="900" class="my-3 w-100">
        <div class="d-flex align-items-center gap-2">
          <Checkbox :modelValue="value" @update:modelValue="handleChange" :binary="true" inputId="rules_accept" />
          <label for="rules_accept">
            {{ $t('auth.rules_accept_before') }}
            <a @click="rules.active = true" class="mx-1">{{ $t('auth.rules_accept_link') }}</a>
            {{ $t('auth.rules_accept_after') }}
          </label>
        </div>
      </div>
    </Field>
    <div class="w-100" data-aos="zoom-in-right" data-aos-delay="1050">
      <Button :disabled="!meta.valid" type="submit" size="large" :label="$t('auth.sign_up')" class="w-100" />
    </div>
    <p data-aos="zoom-in-right" data-aos-delay="1200" class="mb-0 mt-4 d-flex align-items-center mb-4">
      {{ $t('auth.have_account') }} <NuxtLink class="ms-2" to="/auth">{{ $t('header.login') }}</NuxtLink>
    </p>
  </Form>
</template>

<script setup lang="ts">
import { Form, Field } from 'vee-validate'
import { useReCaptcha } from 'vue-recaptcha-v3'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { $unicore, $auth, $api, $t } = useNuxtApp()
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

const rulesAccepted = (value: unknown) => value === true || $t('auth.rules_required')

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
    $unicore.authErrorNotification(err, $t('auth.already_exists'))
  } finally {
    loading.close()
  }
}
</script>

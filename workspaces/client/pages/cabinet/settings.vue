<template>
  <div class="row settings-split px-4">
    <div class="col-xl-6">
      <h2 class="mt-0 mb-2">{{ $t('auth.change_password') }}</h2>
      <p class="mt-0 mb-3">{{ $t('cabinet.password_hint') }}</p>
      <Form v-slot="{ meta }">
        <h3 class="mb-1 mt-0">{{ $t('cabinet.current_password') }}</h3>
        <Field
          v-model="password_form.password_old"
          :name="$t('cabinet.current_password')"
          rules="required"
          v-slot="{ value, errorMessage, handleChange, handleBlur }"
        >
          <Password
            :feedback="false"
            :toggleMask="true"
            :modelValue="value"
            @update:modelValue="handleChange"
            @blur="handleBlur"
            :placeholder="$t('cabinet.current_password')"
            class="w-100"
            inputClass="w-100"
            :class="errorMessage && 'p-invalid'"
          />
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </Field>
        <h3 class="mb-1 mt-3">{{ $t('auth.new_password') }}</h3>
        <Field
          v-model="password_form.password"
          name="password"
          rules="required|min:8|max:128"
          v-slot="{ value, errorMessage, handleChange, handleBlur }"
        >
          <Password
            :feedback="false"
            :toggleMask="true"
            :modelValue="value"
            @update:modelValue="handleChange"
            @blur="handleBlur"
            :placeholder="$t('auth.new_password')"
            class="w-100"
            inputClass="w-100"
            :class="errorMessage && 'p-invalid'"
          />
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </Field>
        <h3 class="mb-1 mt-3">{{ $t('cabinet.repeat_password') }}</h3>
        <Field
          v-model="password_form.password_confirm"
          :name="$t('cabinet.repeat_password')"
          rules="required|confirmed:@password"
          v-slot="{ value, errorMessage, handleChange, handleBlur }"
        >
          <Password
            :feedback="false"
            :toggleMask="true"
            :modelValue="value"
            @update:modelValue="handleChange"
            @blur="handleBlur"
            :placeholder="$t('cabinet.repeat_password')"
            class="w-100"
            inputClass="w-100"
            :class="errorMessage && 'p-invalid'"
          />
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </Field>
        <div class="flex align-items-center gap-2 mb-1 mt-3">
          <Checkbox v-model="password_form.close" :binary="true" inputId="sessionsClose" />
          <label for="sessionsClose">{{ $t('auth.close_sessions') }}</label>
        </div>
        <Button @click="changePassword()" :disabled="!meta.valid" class="mt-3 w-full" size="large" :label="$t('auth.change_password')" />
      </Form>
    </div>
    <div class="col ps-xl-5 mt-5 mt-xl-0">
      <h2 class="mb-2 mt-0">{{ $t('cabinet.two_factor') }}</h2>
      <div v-if="!$auth.user.two_factor_enabled" v-show="two_factor && !$auth.user.two_factor_enabled">
        <div class="text-sm mini-profile p-2 my-3">
          <p class="m-0">{{ $t('cabinet.two_factor_text1') }}</p>
          <p class="mt-1 mb-0">{{ $t('cabinet.two_factor_text2') }}</p>
          <p class="m-0">{{ $t('cabinet.two_factor_text3') }}</p>
        </div>
        <p v-if="two_factor" class="m-0 text-sm">{{ $t('cabinet.secret_key') }} <b v-text="two_factor.base32" /></p>
        <p class="m-0 text-sm">{{ $t('cabinet.account') }} <b v-text="$auth.user.username" /></p>
        <p class="m-0 text-sm">
          {{ $t('cabinet.time_based') }} <b>{{ $t('cabinet.time_based_value') }}</b>
        </p>
        <div class="row mt-3">
          <div class="col-xl-5 d-flex justify-content-center mb-3 mb-xl-0">
            <canvas ref="qrcode" />
          </div>
          <div class="col">
            <Form v-slot="{ meta }">
              <Field
                v-model="two_factor_form.code"
                :name="$t('auth.totp_code')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <InputText
                  :modelValue="value"
                  @update:modelValue="handleChange"
                  @blur="handleBlur"
                  :placeholder="$t('auth.totp_code')"
                  class="w-100"
                />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </Field>
              <Button
                :disabled="!meta.valid"
                @click="TwoFactorEnable()"
                class="mt-3 w-full"
                size="large"
                :label="$t('cabinet.two_factor_enable')"
              />
            </Form>
          </div>
        </div>
      </div>
      <div v-else-if="$auth.user.two_factor_enabled && !two_factor">
        <p class="m-0">
          {{ $t('cabinet.status') }} <b class="text-success">{{ $t('cabinet.two_factor_on') }}</b>
        </p>
        <p class="m-0">{{ $t('cabinet.account') }} <b v-text="$auth.user.username" /></p>
        <p class="mt-0 mb-3">
          {{ $t('cabinet.time_based') }} <b>{{ $t('cabinet.time_based_value') }}</b>
        </p>
        <Form v-slot="{ meta }">
          <Field
            v-model="two_factor_form.code"
            :name="$t('auth.totp_code')"
            rules="required"
            v-slot="{ value, errorMessage, handleChange, handleBlur }"
          >
            <InputText
              :modelValue="value"
              @update:modelValue="handleChange"
              @blur="handleBlur"
              :placeholder="$t('auth.totp_code')"
              class="w-100"
            />
            <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
          </Field>
          <Button
            :disabled="!meta.valid"
            @click="TwoFactorDisable()"
            class="mt-3 w-full"
            size="large"
            :label="$t('cabinet.two_factor_disable')"
          />
        </Form>
      </div>
      <div v-if="!two_factor && !$auth.user.two_factor_enabled">
        <Skeleton width="100%" height="120px" class="mb-3 mt-4"></Skeleton>
        <Skeleton width="100%" class="mb-2"></Skeleton>
        <Skeleton width="100%" class="mb-2"></Skeleton>
        <Skeleton width="100%" class="mb-2"></Skeleton>
        <div class="row mt-3">
          <div class="col-xl-5 d-flex justify-content-center mb-3 mb-xl-0">
            <Skeleton size="150px"></Skeleton>
          </div>
          <div class="col">
            <Skeleton width="100%" height="25px" class="mb-2"></Skeleton>
            <Skeleton width="100%" height="25px"></Skeleton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import QRCode from 'qrcode-with-logos'
import { Form, Field } from 'vee-validate'

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'cabinet.tab_settings' })

const { $api, $auth, $unicore, $t } = useNuxtApp()

useHead({ title: computed(() => $t('header.cabinet')) })

const qrcode = ref(null)
const password_form = reactive({
  password_old: '',
  password: '',
  password_confirm: '',
  close: true,
})
const two_factor_form = reactive({
  code: '',
})
const two_factor = ref(null)

onMounted(async () => {
  if (!$auth.user.two_factor_enabled) await GenerateQR()
})

async function changePassword() {
  if (password_form.password_old == password_form.password) return $unicore.errorNotification($t('cabinet.password_same'))

  const loading = $unicore.loading()
  try {
    await $api.post('/cabinet/settings/password', password_form).then((res) => res.data)
    $unicore.successNotification($t('cabinet.password_changed'))
    if (password_form.close) $unicore.logout()
  } catch {
    $unicore.errorNotification($t('cabinet.password_wrong'))
  }
  loading.close()
}

async function GenerateQR() {
  two_factor.value = await $api.get('/cabinet/2fa/generate').then((res) => res.data)
  await new QRCode({
    canvas: qrcode.value,
    content: two_factor.value.otpauth_url,
    logo: {
      src: '/icon.png',
    },
    width: 150,
    nodeQrCodeOptions: {
      margin: 1,
    },
  }).toImage()
}

async function TwoFactorEnable() {
  const loading = $unicore.loading()
  try {
    await $api.post('/cabinet/2fa/enable', two_factor_form).then((res) => res.data)
    await $auth.fetchUser()
    two_factor_form.code = ''
    two_factor.value = null
    $unicore.successNotification($t('cabinet.two_factor_enabled'))
  } catch {
    $unicore.errorNotification($t('auth.totp_wrong'))
  }
  loading.close()
}

async function TwoFactorDisable() {
  const loading = $unicore.loading()
  try {
    await $api.post('/cabinet/2fa/disable', two_factor_form).then((res) => res.data)
    await Promise.all([$auth.fetchUser(), GenerateQR()])
    two_factor_form.code = ''
    $unicore.successNotification($t('cabinet.two_factor_disabled'))
  } catch {
    $unicore.errorNotification($t('auth.totp_wrong'))
  }
  loading.close()
}
</script>

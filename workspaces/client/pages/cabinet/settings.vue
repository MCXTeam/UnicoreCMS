<template>
  <div class="cab-grid">
    <CabTile v-if="canPassword" :title="$t('auth.change_password')" icon="bx bx-lock-alt" :span="6">
      <p class="cab-sub mt-0 mb-3">{{ $t(forcedPassword ? 'cabinet.password_change_required' : 'cabinet.password_hint') }}</p>
      <Form v-slot="{ meta }" class="cab-form">
        <label class="cab-label">{{ $t('cabinet.current_password') }}</label>
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
        <label class="cab-label">{{ $t('auth.new_password') }}</label>
        <Field
          v-model="password_form.password"
          name="password"
          rules="required|isStrongPassword"
          v-slot="{ value, errorMessage, handleChange, handleBlur }"
        >
          <div class="d-flex gap-2">
            <Password
              ref="passwordField"
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
            <Button type="button" outlined v-tooltip.bottom="$t('auth.password_generate')" @click="fillGeneratedPassword(handleChange)">
              <i class="bx bx-refresh"></i>
            </Button>
          </div>
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </Field>
        <label class="cab-label">{{ $t('cabinet.repeat_password') }}</label>
        <Field
          v-model="password_form.password_confirm"
          :name="$t('cabinet.repeat_password')"
          rules="required|confirmed:@password"
          v-slot="{ value, errorMessage, handleChange, handleBlur }"
        >
          <Password
            ref="passwordConfirmField"
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
        <div class="d-flex align-items-center gap-2">
          <Checkbox v-model="password_form.close" :binary="true" inputId="sessionsClose" />
          <label for="sessionsClose">{{ $t('auth.close_sessions') }}</label>
        </div>
        <Button @click="changePassword()" :disabled="!meta.valid" class="w-100" :label="$t('auth.change_password')" />
      </Form>
    </CabTile>

    <CabTile v-if="canEmail" :title="$t('cabinet.email_change')" icon="bx bx-envelope" :span="6">
      <p class="cab-sub mt-0 mb-3">{{ $t('cabinet.email_hint') }}</p>
      <p class="m-0 mb-3 text-sm">
        {{ $t('cabinet.email_current') }} <b v-text="$auth.user?.email || $t('cabinet.email_none')" />
      </p>
      <Form v-if="!email_form.sent" v-slot="{ meta }" class="cab-form">
        <label class="cab-label">{{ $t('cabinet.email_new') }}</label>
        <Field v-model="email_form.email" name="email" rules="required|email" v-slot="{ value, errorMessage, handleChange, handleBlur }">
          <InputText
            :modelValue="value"
            @update:modelValue="handleChange"
            @blur="handleBlur"
            :placeholder="$t('cabinet.email_new')"
            class="w-100"
            :class="errorMessage && 'p-invalid'"
          />
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </Field>
        <label class="cab-label">{{ $t('cabinet.current_password') }}</label>
        <Field
          v-model="email_form.password"
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
        <Button @click="requestEmail()" :disabled="!meta.valid" class="w-100" :label="$t('cabinet.email_send_code')" />
      </Form>
      <Form v-else v-slot="{ meta }" class="cab-form">
        <p class="m-0 text-sm">{{ $t('cabinet.email_code_sent', { email: email_form.email }) }}</p>
        <label class="cab-label">{{ $t('auth.activation_code') }}</label>
        <Field
          v-model="email_form.code"
          name="code"
          :rules="`required|min:${codeLength}|max:${codeLength}`"
          v-slot="{ value, errorMessage, handleChange, handleBlur }"
        >
          <InputText
            :modelValue="value"
            @update:modelValue="handleChange"
            @blur="handleBlur"
            :placeholder="$t('auth.activation_code')"
            class="w-100"
            :class="errorMessage && 'p-invalid'"
          />
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </Field>
        <Button @click="confirmEmail()" :disabled="!meta.valid" class="w-100" :label="$t('cabinet.email_confirm')" />
        <Button text class="w-100" :label="$t('common.cancel')" @click="resetEmailForm()" />
      </Form>
    </CabTile>

    <CabTile v-if="showTwoFactor" :title="$t('cabinet.two_factor')" icon="bx bx-shield-quarter" :span="6">
      <div v-if="!$auth.user.two_factor_enabled" v-show="two_factor && !$auth.user.two_factor_enabled">
        <div class="cab-note mb-3">
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
            <Form v-slot="{ meta }" class="cab-form">
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
                v-if="canTwoFactorOn"
                :disabled="!meta.valid"
                class="w-100"
                :label="$t('cabinet.two_factor_enable')"
                @click="TwoFactorEnable()"
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
        <Form v-slot="{ meta }" class="cab-form">
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
            v-if="canTwoFactorOff"
            :disabled="!meta.valid"
            class="w-100"
            :label="$t('cabinet.two_factor_disable')"
            @click="TwoFactorDisable()"
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
    </CabTile>
  </div>
</template>

<script setup>
import QRCode from 'qrcode-with-logos'
import { Form, Field } from 'vee-validate'
import { EMAIL_CODE_EXPIRED, EMAIL_CODE_LENGTH } from 'unicore-common'
import { serverMessage } from 'unicore-common/messages'

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'cabinet.tab_settings', hint: 'cabinet.settings_hint' })

const { $auth, $unicore, $t } = useNuxtApp()

const cabinet = useCabinet()
const twoFactor = useTwoFactor()

const { canPassword, canEmail, canTwoFactorOn, canTwoFactorOff } = useAccess({
  canPassword: 'player.password.change',
  canEmail: 'player.email.change',
  canTwoFactorOn: 'player.twofactor.on',
  canTwoFactorOff: 'player.twofactor.off',
})

useHead({ title: computed(() => $t('header.cabinet')) })

const showTwoFactor = computed(() =>
  $auth.user?.two_factor_enabled ? canTwoFactorOff.value : canTwoFactorOn.value,
)

const forcedPassword = computed(() => Boolean($auth.user?.password_change_required))

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
const email_form = reactive({
  email: '',
  password: '',
  code: '',
  sent: false,
})
const codeLength = EMAIL_CODE_LENGTH
const two_factor = ref(null)
const { passwordField, passwordConfirmField, fill: fillGeneratedPassword } = usePasswordGenerator((password) => {
  password_form.password = password
  password_form.password_confirm = password
})

onMounted(async () => {
  if (!$auth.user.two_factor_enabled) await GenerateQR()
})

async function changePassword() {
  if (password_form.password_old == password_form.password) return $unicore.errorNotification($t('cabinet.password_same'))

  const loading = $unicore.loading()
  try {
    await cabinet.changePassword(password_form)
    $unicore.successNotification($t('cabinet.password_changed'))
    if (password_form.close) $unicore.logout()
    else await $auth.fetchUser()
  } catch (err) {
    $unicore.errorNotification($t('cabinet.password_wrong'), err)
  }
  loading.close()
}

function resetEmailForm() {
  email_form.email = ''
  email_form.password = ''
  email_form.code = ''
  email_form.sent = false
}

async function requestEmail() {
  const loading = $unicore.loading()
  try {
    await cabinet.requestEmailChange(email_form.email, email_form.password)
    email_form.password = ''
    email_form.sent = true
  } catch (err) {
    $unicore.errorNotification($t('cabinet.email_request_failed'), err)
  }
  loading.close()
}

async function confirmEmail() {
  const loading = $unicore.loading()
  try {
    await cabinet.confirmEmailChange(email_form.code)
    await $auth.fetchUser()
    resetEmailForm()
    $unicore.successNotification($t('cabinet.email_changed'))
  } catch (err) {
    if (serverMessage(err) === EMAIL_CODE_EXPIRED) resetEmailForm()

    $unicore.errorNotification($t('auth.code_invalid'), err)
  }
  loading.close()
}

async function GenerateQR() {
  two_factor.value = await twoFactor.generate()
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
  }).getCanvas()
}

async function TwoFactorEnable() {
  const loading = $unicore.loading()
  try {
    await twoFactor.enable(two_factor_form.code)
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
    await twoFactor.disable(two_factor_form.code)
    await Promise.all([$auth.fetchUser(), GenerateQR()])
    two_factor_form.code = ''
    $unicore.successNotification($t('cabinet.two_factor_disabled'))
  } catch {
    $unicore.errorNotification($t('auth.totp_wrong'))
  }
  loading.close()
}
</script>

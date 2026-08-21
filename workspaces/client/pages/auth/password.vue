<template>
  <Form v-slot="{ meta }" class="d-flex flex-column align-items-center w-100" @submit="reset">
    <h3 data-aos="zoom-in-right" data-aos-delay="150" class="text-uppercase text-center mb-4">{{ $t('auth.new_password_title') }}</h3>
    <Field
      v-model="form.password"
      name="password"
      rules="required|min:8|max:128"
      v-slot="{ value, errorMessage, handleChange, handleBlur }"
    >
      <div data-aos="zoom-in-right" data-aos-delay="300" class="w-100 mb-3">
        <Password
          :modelValue="value"
          @update:modelValue="handleChange"
          @blur="handleBlur"
          :feedback="false"
          :toggleMask="true"
          :placeholder="$t('auth.new_password')"
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
      <div data-aos="zoom-in-right" data-aos-delay="450" class="w-100">
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
    <div data-aos="zoom-in-right" data-aos-delay="600" class="my-3 w-100">
      <Message severity="info" :closable="false">{{ $t('auth.sessions_closed_hint') }}</Message>
    </div>
    <div class="w-100" data-aos="zoom-in-right" data-aos-delay="750">
      <Button :disabled="!meta.valid" type="submit" size="large" :label="$t('auth.change_password')" class="w-100" />
    </div>
    <p data-aos="zoom-in-right" data-aos-delay="900" class="mb-0 mt-4 d-flex align-items-center mb-4">
      {{ $t('auth.remember_password') }} <NuxtLink class="ms-2" to="/auth">{{ $t('header.login') }}</NuxtLink>
    </p>
  </Form>
</template>

<script setup lang="ts">
import { Form, Field } from 'vee-validate'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { $unicore, $t } = useNuxtApp()

const authFlow = useAuthFlow()
const route = useRoute()

const form = reactive({
  password: '',
  password_confirm: '',
})

onMounted(async () => {
  try {
    await authFlow.password({ hash: route.query.hash })
  } catch {
    $unicore.errorNotification($t('auth.reset_link_invalid'))
    await navigateTo('/auth')
  }
})

async function reset() {
  const loading = $unicore.loading()
  try {
    await authFlow.password({ ...form, hash: route.query.hash })
    $unicore.successNotification($t('auth.password_changed'))
    await navigateTo('/auth')
  } catch {
    $unicore.errorNotification($t('auth.reset_link_invalid'))
    await navigateTo('/auth')
  } finally {
    loading.close()
  }
}
</script>

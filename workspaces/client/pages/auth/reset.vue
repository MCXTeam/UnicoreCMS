<template>
  <section>
    <Dialog v-model:visible="modal" modal :closable="false" :header="$t('auth.reset_sent_title')" :style="{ width: '50rem' }">
      <div class="m-3 text-center">{{ $t('auth.reset_sent_text', { email: form.email }) }}</div>
    </Dialog>
    <Form v-slot="{ meta }" class="d-flex flex-column align-items-center w-100" @submit="reset">
      <h3 data-aos="zoom-in-right" data-aos-delay="150" class="text-uppercase text-center mb-4">{{ $t('auth.forgot_password') }}</h3>
      <div class="w-100">
        <p class="text-center mb-4 w-100">{{ $t('auth.reset_hint') }}</p>
        <Field
          v-model="form.email"
          :name="$t('auth.email')"
          rules="required|email"
          v-slot="{ value, errorMessage, handleChange, handleBlur }"
        >
          <IconField data-aos="zoom-in-right" data-aos-delay="300" class="w-100 mb-3">
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
      </div>
      <div class="w-100" data-aos="zoom-in-right" data-aos-delay="450">
        <Button :disabled="!meta.valid" type="submit" size="large" :label="$t('auth.send_email')" class="w-100" />
      </div>
      <p data-aos="zoom-in-right" data-aos-delay="600" class="mb-0 mt-4 d-flex align-items-center mb-4">
        {{ $t('auth.remember_password') }} <NuxtLink class="ms-2" to="/auth">{{ $t('header.login') }}</NuxtLink>
      </p>
    </Form>
  </section>
</template>

<script setup lang="ts">
import { Form, Field } from 'vee-validate'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { $unicore, $t } = useNuxtApp()

const authFlow = useAuthFlow()

const form = reactive({
  email: '',
})
const modal = ref(false)

async function reset() {
  const loading = $unicore.loading()
  try {
    await authFlow.reset(form)
    modal.value = true
  } catch {
    $unicore.errorNotification($t('auth.email_not_found'))
  } finally {
    loading.close()
  }
}
</script>

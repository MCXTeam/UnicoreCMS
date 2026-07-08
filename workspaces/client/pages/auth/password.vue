<template>
  <Form v-slot="{ meta }" class="d-flex flex-column align-items-center w-100" @submit="reset">
    <h3 data-aos="zoom-in-right" data-aos-delay="150" class="text-uppercase text-center mb-4">Восстановление пароля</h3>
    <Field v-model="form.password" name="password" rules="required|min:6|max:24" v-slot="{ value, errorMessage, handleChange, handleBlur }">
      <div data-aos="zoom-in-right" data-aos-delay="300" class="w-100 mb-3">
        <Password
          :modelValue="value"
          @update:modelValue="handleChange"
          @blur="handleBlur"
          :feedback="false"
          :toggleMask="true"
          placeholder="Новый пароль"
          class="w-100"
          inputClass="w-100"
          :class="errorMessage && 'p-invalid'"
        />
      </div>
      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
    </Field>
    <Field
      v-model="form.password_confirm"
      name="Подтверждение пароля"
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
          placeholder="Подтверждение пароля"
          class="w-100"
          inputClass="w-100"
          :class="errorMessage && 'p-invalid'"
        />
      </div>
      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
    </Field>
    <Field v-model="form.close" name="Сеансы" :rules="sessionsRequired" v-slot="{ value, handleChange }">
      <div data-aos="zoom-in-right" data-aos-delay="600" class="my-3 w-100">
        <div class="d-flex align-items-center gap-2">
          <Checkbox :modelValue="value" @update:modelValue="handleChange" :binary="true" inputId="close_sessions" />
          <label for="close_sessions">Завершить все сеансы?</label>
        </div>
      </div>
    </Field>
    <div class="w-100" data-aos="zoom-in-right" data-aos-delay="750">
      <Button :disabled="!meta.valid" type="submit" size="large" label="Сменить пароль" class="w-100" />
    </div>
    <p data-aos="zoom-in-right" data-aos-delay="900" class="mb-0 mt-4 d-flex align-items-center mb-4">
      Помните свой пароль? <NuxtLink class="ms-2" to="/auth">Войти</NuxtLink>
    </p>
  </Form>
</template>

<script setup lang="ts">
import { Form, Field } from 'vee-validate'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { $unicore, $api } = useNuxtApp()
const route = useRoute()

const form = reactive({
  password: '',
  password_confirm: '',
  close: true,
})

const sessionsRequired = (value: unknown) => value === true || 'Необходимо подтвердить'

onMounted(async () => {
  try {
    await $api.post('/auth/password', { hash: route.query.hash })
  } catch {
    $unicore.errorNotification('Невалидная ссылка, либо время на сброс пароля по данной ссылке истекло')
    await navigateTo('/auth')
  }
})

async function reset() {
  const loading = $unicore.loading()
  try {
    await $api.post('/auth/password', { ...form, hash: route.query.hash })
    $unicore.successNotification('Пароль успешно изменён, войдите в ваш аккаунт')
    await navigateTo('/auth')
  } catch {
    $unicore.errorNotification('Невалидная ссылка, либо время на сброс пароля по данной ссылке истекло')
    await navigateTo('/auth')
  } finally {
    loading.close()
  }
}
</script>

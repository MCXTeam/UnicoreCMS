<template>
  <section>
    <Dialog v-model:visible="modal" modal :closable="false" header="Восстановление доступа" :style="{ width: '50rem' }">
      <div class="m-3 text-center">
        На указанный вами адрес электронной почты ({{ form.email }}) было высланно письмо с ссылкой для продолжения процедуры восстановления
        доступа.
      </div>
    </Dialog>
    <Form v-slot="{ meta }" class="d-flex flex-column align-items-center w-100" @submit="reset">
      <h3 data-aos="zoom-in-right" data-aos-delay="150" class="text-uppercase text-center mb-4">Забыли пароль?</h3>
      <div class="w-100">
        <p class="text-center mb-4 w-100">
          Введите адрес электронной почты, который был использован для регистрации. Ваб будет выслано письмо с дальнейшими инструкциями по
          сбросу пароля.
        </p>
        <Field v-model="form.email" name="Email" rules="required|email" v-slot="{ value, errorMessage, handleChange, handleBlur }">
          <IconField data-aos="zoom-in-right" data-aos-delay="300" class="w-100 mb-3">
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
      </div>
      <div class="w-100" data-aos="zoom-in-right" data-aos-delay="450">
        <Button :disabled="!meta.valid" type="submit" size="large" label="Отправить письмо" class="w-100" />
      </div>
      <p data-aos="zoom-in-right" data-aos-delay="600" class="mb-0 mt-4 d-flex align-items-center mb-4">
        Помните свой пароль? <NuxtLink class="ms-2" to="/auth">Войти</NuxtLink>
      </p>
    </Form>
  </section>
</template>

<script setup lang="ts">
import { Form, Field } from 'vee-validate'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { $unicore, $api } = useNuxtApp()

const form = reactive({
  email: '',
})
const modal = ref(false)

async function reset() {
  const loading = $unicore.loading()
  try {
    await $api.post('/auth/reset', form)
    modal.value = true
  } catch {
    $unicore.errorNotification('Игрока с данным email не существует')
  } finally {
    loading.close()
  }
}
</script>

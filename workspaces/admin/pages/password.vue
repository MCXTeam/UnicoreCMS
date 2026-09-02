<template>
  <div
    class="h-full w-full m-0 py-7 px-4"
    style="border-radius: 53px; background: linear-gradient(180deg, var(--surface-50) 38.9%, var(--surface-0))"
  >
    <div class="text-center mb-5">
      <div class="text-900 text-3xl font-medium mb-3">{{ $t('admin.password_change_title') }}</div>
      <span class="text-600 font-medium">{{ $t('admin.password_change_subtitle') }}</span>
    </div>

    <Form @submit="submit" v-slot="{ meta }" class="w-full md:w-10 mx-auto">
      <Field
        v-model="form.password_old"
        name="password_old"
        :label="$t('cabinet.current_password')"
        rules="required"
        v-slot="{ value, errorMessage, handleChange, handleBlur }"
      >
        <div class="field p-fluid mb-3">
          <label class="block text-900 font-medium text-xl mb-2">{{ $t('cabinet.current_password') }}</label>
          <Password
            :feedback="false"
            :disabled="loading"
            :modelValue="value"
            @update:modelValue="handleChange"
            @blur="handleBlur"
            :placeholder="$t('cabinet.current_password')"
            :toggleMask="true"
            class="w-full"
            :class="errorMessage && 'p-invalid'"
            inputClass="w-full"
            inputStyle="padding:1rem"
          />
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </div>
      </Field>
      <Field
        v-model="form.password"
        name="password"
        :label="$t('auth.new_password')"
        rules="required|isStrongPassword"
        v-slot="{ value, errorMessage, handleChange, handleBlur }"
      >
        <div class="field p-fluid mb-3">
          <label class="block text-900 font-medium text-xl mb-2">{{ $t('auth.new_password') }}</label>
          <Password
            :feedback="false"
            :disabled="loading"
            :modelValue="value"
            @update:modelValue="handleChange"
            @blur="handleBlur"
            :placeholder="$t('auth.new_password')"
            :toggleMask="true"
            class="w-full"
            :class="errorMessage && 'p-invalid'"
            inputClass="w-full"
            inputStyle="padding:1rem"
          />
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </div>
      </Field>
      <Field
        v-model="form.password_confirm"
        name="password_confirm"
        :label="$t('cabinet.repeat_password')"
        rules="required|confirmed:@password"
        v-slot="{ value, errorMessage, handleChange, handleBlur }"
      >
        <div class="field p-fluid mb-3">
          <label class="block text-900 font-medium text-xl mb-2">{{ $t('cabinet.repeat_password') }}</label>
          <Password
            :feedback="false"
            :disabled="loading"
            :modelValue="value"
            @update:modelValue="handleChange"
            @blur="handleBlur"
            :placeholder="$t('cabinet.repeat_password')"
            :toggleMask="true"
            class="w-full"
            :class="errorMessage && 'p-invalid'"
            inputClass="w-full"
            inputStyle="padding:1rem"
          />
          <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
        </div>
      </Field>
      <Button
        :disabled="loading || !meta.valid"
        type="submit"
        :label="$t('auth.change_password')"
        class="w-full p-3 text-xl mt-5"
      ></Button>
    </Form>
  </div>
</template>

<script setup>
import { Form, Field } from 'vee-validate'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'auth' })

const authStore = useAuthStore()
const toast = useToast()
const { $api, $t, $utils } = useNuxtApp()

useHead({ title: computed(() => $t('admin.password_change_title')) })

const loading = ref(false)
const form = reactive({
  password_old: '',
  password: '',
  password_confirm: '',
})

async function submit() {
  loading.value = true
  try {
    await $api.post('/cabinet/settings/password', { password_old: form.password_old, password: form.password })
    await authStore.fetchUser()
    toast.add({ severity: 'success', summary: $t('common.success'), detail: $t('cabinet.password_changed'), life: 3000 })
    await navigateTo('/')
  } catch (err) {
    $utils.notifyError(err, $t('cabinet.password_wrong'))
  } finally {
    loading.value = false
  }
}
</script>

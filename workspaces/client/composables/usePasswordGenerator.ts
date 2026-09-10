import { generatePassword } from 'unicore-common/password'

export const usePasswordGenerator = (apply: (password: string) => void) => {
  const passwordField = ref<any>(null)
  const passwordConfirmField = ref<any>(null)

  const unmask = (field: any) => {
    if (field && !field.unmasked) field.onMaskToggle()
  }

  const fill = (handleChange: (value: string) => void) => {
    const password = generatePassword()

    apply(password)
    handleChange(password)
    unmask(passwordField.value)
    unmask(passwordConfirmField.value)
  }

  return { passwordField, passwordConfirmField, fill }
}

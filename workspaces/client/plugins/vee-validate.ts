import { defineRule, configure } from 'vee-validate'
import * as AllRules from '@vee-validate/rules'
import { localize, setLocale } from '@vee-validate/i18n'
import ru from '@vee-validate/i18n/dist/locale/ru.json'
import { isUsername, IS_USERNAME, IS_USERNAME_OR_EMAIL } from 'unicore-common/validation'

export default defineNuxtPlugin(() => {
  Object.entries(AllRules).forEach(([name, rule]) => {
    if (typeof rule === 'function') defineRule(name, rule as any)
  })

  defineRule(IS_USERNAME, (value: any) => isUsername(value) || 'Некорректное имя пользователя')
  defineRule(
    IS_USERNAME_OR_EMAIL,
    (value: any) => isUsername(value) || (AllRules as any).email(value) === true || 'Некорректный Email или Имя пользователя',
  )

  configure({ generateMessage: localize({ ru: ru as any }) })
  setLocale('ru')
})

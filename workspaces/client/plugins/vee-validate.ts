import { defineRule, configure } from 'vee-validate'
import * as AllRules from '@vee-validate/rules'
import { localize, setLocale } from '@vee-validate/i18n'
import ru from '@vee-validate/i18n/dist/locale/ru.json'
import en from '@vee-validate/i18n/dist/locale/en.json'
import {
  isUsername,
  passwordContextOf,
  passwordIssue,
  IS_STRONG_PASSWORD,
  IS_USERNAME,
  IS_USERNAME_OR_EMAIL,
  PASSWORD_ISSUE_PREFIX,
} from 'unicore-common/validation'
import { useLocale } from '~/composables/useLocale'

export default defineNuxtPlugin((nuxtApp) => {
  const locale = useLocale()
  const t = (key: string) => String((nuxtApp as any).$t?.(key) ?? key)
  const { sitename } = useRuntimeConfig().public

  Object.entries(AllRules).forEach(([name, rule]) => {
    if (typeof rule === 'function') defineRule(name, rule as any)
  })

  defineRule(IS_USERNAME, (value: any) => isUsername(value) || t('validation.username'))
  defineRule(IS_STRONG_PASSWORD, (value: any, _params: any, ctx: any) => {
    const issue = passwordIssue(value, passwordContextOf(ctx?.form, sitename))

    return issue ? t(`validation.${PASSWORD_ISSUE_PREFIX}${issue}`) : true
  })
  defineRule(
    IS_USERNAME_OR_EMAIL,
    (value: any) => isUsername(value) || (AllRules as any).email(value) === true || t('validation.username_or_email'),
  )

  configure({ generateMessage: localize({ ru: ru as any, en: en as any }) })

  watchEffect(() => setLocale(locale.value === 'ru' ? 'ru' : 'en'))
})

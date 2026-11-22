import { useReCaptcha } from 'vue-recaptcha-v3'

export const useAuthRecaptcha = () => {
  const recaptcha = useReCaptcha()

  return async (action: string): Promise<string | undefined> => {
    if (!recaptcha) return undefined

    let expired = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        expired = true
        reject(new Error('error.recaptcha_timeout'))
      }, 20_000)
    })

    try {
      const token = await Promise.race([
        (async () => {
          await recaptcha.recaptchaLoaded()
          if (expired) throw new Error('error.recaptcha_timeout')
          return recaptcha.executeRecaptcha(action)
        })(),
        timeout,
      ])
      if (!token) throw new Error('error.recaptcha')
      return token
    } catch {
      throw new Error(expired ? 'error.recaptcha_timeout' : 'error.recaptcha')
    } finally {
      clearTimeout(timer)
    }
  }
}

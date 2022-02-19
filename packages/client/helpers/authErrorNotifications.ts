import { AxiosError } from 'axios'

const config = {
  icon: `<i class='bx bxs-bug' ></i>`,
  color: 'danger',
  position: 'top-right',
  title: 'Ошибка авторизации!',
}

export function authErrorNotifications(res: AxiosError, instanse: any, text: string) {
  if (res.response?.status == 429) {
    instanse.$vs.notification({
      ...config,
      text: `Слишком много запросов, подождите пару минут...`,
    })
  } else {
    instanse.$vs.notification({ ...config, text })
  }
}
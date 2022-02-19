const config = {
  icon: `<i class='bx bxs-bug' ></i>`,
  color: 'danger',
  position: 'top-right',
  title: 'Ошибка!',
}

export function errorNotifications(instanse: any, text: string) {
  instanse.$vs.notification({ ...config, text })
}
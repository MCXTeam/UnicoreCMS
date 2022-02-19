const config = {
  icon: `<i class='bx bx-select-multiple' ></i>`,
  color: 'success',
  position: 'top-right',
  title: 'Успех!',
}

export function successNotifications(instanse: any, text: string) {
  instanse.$vs.notification({ ...config, text })
}
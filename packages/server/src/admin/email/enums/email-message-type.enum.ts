export enum EmailMessageType {
  /**
   * Активация аккаунта
   */
  Activation = 'activations',

  /**
   * Вход с нового устройства
   */
  Device = 'device',

  /**
   * Сброс пароля
   */
  Reset = 'reset',
}

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

  /**
   * Подарок от другого игрока
   */
  Gift = 'gift',

  EmailChange = 'email_change',

  EmailChanged = 'email_changed',
}

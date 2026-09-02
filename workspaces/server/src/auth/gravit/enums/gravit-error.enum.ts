export enum GravitError {
  Require2FA = 'auth.require2fa',
  ExpireToken = 'auth.expiretoken',
  InvalidToken = 'auth.invalidtoken',
  UserNotFound = 'auth.usernotfound',
  WrongPassword = 'auth.wrongpassword',
  Wrong2FA = 'auth.wrong2fa',
  UserBlocked = 'auth.userblocked',
  UserNotActivated = 'auth.usernotactivated',
  PasswordChangeRequired = 'auth.passwordchangerequired',
}

interface Password {
  password: string;
  type: string;
}

interface Password2FA {
  firstPassword: {
    password: string;
    type: string;
  };
  secondPassword: {
    totp: string;
    type: string;
  };
}

export class GravitAuthorize {
  login: string;

  context?: {
    ip: string;
  };

  password: Password | Password2FA;

  minecraftAccess: boolean;
}

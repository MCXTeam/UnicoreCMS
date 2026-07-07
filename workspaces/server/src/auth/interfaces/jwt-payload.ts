export type JWTTokenType = 'access' | 'refresh' | 'minecraft';

export class JWTPayload {
  sub: string;

  api?: boolean;

  type?: JWTTokenType;

  iat?: number;

  exp?: number;
}

export class JWTRefreshPayload extends JWTPayload {
  jwtid: string;
}

export class JWTMinecraftPayload extends JWTPayload {
  ref: string;
}

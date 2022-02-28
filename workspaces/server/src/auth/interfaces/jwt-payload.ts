export class JWTPayload {
  sub: string;

  api?: boolean;

  iat?: number

  exp?: number
}

export class JWTRefreshPayload extends JWTPayload {
  jwtid: string;
}

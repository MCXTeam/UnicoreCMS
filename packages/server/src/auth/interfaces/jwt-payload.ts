export class JWTPayload {
  sub: string;

  api?: boolean;
}

export class JWTRefreshPayload extends JWTPayload {
  jwtid: string;
}

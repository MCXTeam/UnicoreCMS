import { from } from "env-var";

const env = from(
  typeof process !== "undefined" && process.env ? process.env : {},
);

export interface PublicConfig {
  baseurl: string;
  apiBaseurl: string;
  sitename: string;
  frontendPort: number;
  adminPort: number;
  backendPort: number;
  recaptchaPublic: string;
  googleAnalyticsId: string;
  yandexMetrikaId: string;
  jwtExpires: string;
  jwtRefreshExpires: string;
  realDecimals: number;
  virtualDecimals: number;
  ingameDecimals: number;
  colorModePreference: string;
  colorModeFallback: string;
  devseed: boolean;
}

export const publicConfig: PublicConfig = {
  baseurl: env.get("BASEURL").default("http://127.0.0.1:3000").asString(),
  apiBaseurl: env
    .get("API_BASEURL")
    .default("http://127.0.0.1:5000")
    .asString(),
  sitename: env.get("SITENAME").default("UnicoreCMS").asString(),
  frontendPort: env.get("CLIENT_PORT").default(3000).asPortNumber(),
  adminPort: env.get("ADMIN_PORT").default(4000).asPortNumber(),
  backendPort: env.get("SERVER_PORT").default(5000).asPortNumber(),
  recaptchaPublic: env.get("RECAPTCHA_PUBLIC").default("").asString(),
  googleAnalyticsId: env.get("GOOGLE_ANALYTICS_ID").default("").asString(),
  yandexMetrikaId: env.get("YANDEX_METRIKA_ID").default("").asString(),
  jwtExpires: env.get("JWT_EXPIRES").default("5m").asString(),
  jwtRefreshExpires: env.get("JWT_REFRESH_EXPIRES").default("30d").asString(),
  realDecimals: env.get("REAL_DECIMALS").default(2).asInt(),
  virtualDecimals: env.get("VIRTUAL_DECIMALS").default(2).asInt(),
  ingameDecimals: env.get("INGAME_DECIMALS").default(2).asInt(),
  colorModePreference: env
    .get("COLOR_MODE_PREFERENCE")
    .default("dark")
    .asString(),
  colorModeFallback: env.get("COLOR_MODE_FALLBACK").default("dark").asString(),
  devseed: env.get("DEV_SEED").default(0).asBool(),
};

import envVar from "env-var";
import { ports } from "./ports";
import { DEFAULT_TIMEZONE, RUNTIME_ENV_PREFIX } from "./constants";

const env = envVar.from(
  typeof process !== "undefined" && process.env ? process.env : {},
);

export interface PublicConfig {
  baseurl: string;
  timezone: string;
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
  timezone: env.get("TIMEZONE").default(DEFAULT_TIMEZONE).asString().trim(),
  apiBaseurl: env
    .get("API_BASEURL")
    .default("http://127.0.0.1:5000")
    .asString(),
  sitename: env.get("SITENAME").default("UnicoreCMS").asString(),
  frontendPort: ports.frontendPort,
  adminPort: ports.adminPort,
  backendPort: ports.backendPort,
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

const toRuntimeEnvKey = (key: string): string =>
  `${RUNTIME_ENV_PREFIX}${key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase()}`;

export const publicRuntimeEnv = (): Record<string, string> => ({
  ...Object.fromEntries(
    Object.entries(publicConfig).map(([key, value]) => [
      toRuntimeEnvKey(key),
      String(value),
    ]),
  ),
  NUXT_PUBLIC_GTAG_ID: publicConfig.googleAnalyticsId,
  NUXT_PUBLIC_GTAG_ENABLED: String(Boolean(publicConfig.googleAnalyticsId)),
});

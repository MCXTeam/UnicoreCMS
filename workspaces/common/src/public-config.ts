import envVar from "env-var";
import { ports } from "./ports";
import {
  DEFAULT_TIMEZONE,
  PUBLIC_ENV_KEY,
  RUNTIME_ENV_PREFIX,
} from "./constants";

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
  baseurl: env
    .get(PUBLIC_ENV_KEY.baseurl)
    .default("http://127.0.0.1:3000")
    .asString(),
  timezone: env
    .get(PUBLIC_ENV_KEY.timezone)
    .default(DEFAULT_TIMEZONE)
    .asString()
    .trim(),
  apiBaseurl: env
    .get(PUBLIC_ENV_KEY.apiBaseurl)
    .default("http://127.0.0.1:5000")
    .asString(),
  sitename: env.get(PUBLIC_ENV_KEY.sitename).default("UnicoreCMS").asString(),
  frontendPort: ports.frontendPort,
  adminPort: ports.adminPort,
  backendPort: ports.backendPort,
  recaptchaPublic: env
    .get(PUBLIC_ENV_KEY.recaptchaPublic)
    .default("")
    .asString(),
  googleAnalyticsId: env
    .get(PUBLIC_ENV_KEY.googleAnalyticsId)
    .default("")
    .asString(),
  yandexMetrikaId: env
    .get(PUBLIC_ENV_KEY.yandexMetrikaId)
    .default("")
    .asString(),
  jwtExpires: env.get(PUBLIC_ENV_KEY.jwtExpires).default("5m").asString(),
  jwtRefreshExpires: env
    .get(PUBLIC_ENV_KEY.jwtRefreshExpires)
    .default("30d")
    .asString(),
  realDecimals: env.get(PUBLIC_ENV_KEY.realDecimals).default(2).asInt(),
  virtualDecimals: env.get(PUBLIC_ENV_KEY.virtualDecimals).default(2).asInt(),
  ingameDecimals: env.get(PUBLIC_ENV_KEY.ingameDecimals).default(2).asInt(),
  colorModePreference: env
    .get(PUBLIC_ENV_KEY.colorModePreference)
    .default("dark")
    .asString(),
  colorModeFallback: env
    .get(PUBLIC_ENV_KEY.colorModeFallback)
    .default("dark")
    .asString(),
  devseed: env.get(PUBLIC_ENV_KEY.devseed).default(0).asBool(),
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

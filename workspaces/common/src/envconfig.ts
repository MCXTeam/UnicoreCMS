import envVar from "env-var";
import { config } from "dotenv";
import { envFilePath, ports } from "./ports";
import {
  DEFAULT_ARGON2_MEMORY,
  DEFAULT_ARGON2_PARALLELISM,
  DEFAULT_ARGON2_TIME,
  DEFAULT_BCRYPT_COST,
  DEFAULT_PASSWORD_ALGORITHM,
  DEFAULT_TIMEZONE,
  PASSWORD_ALGORITHMS,
  PUBLIC_ENV_KEY,
} from "./constants";
import { isValidTimezone } from "./timezone";

const env = envVar.from(process.env);
config({ path: envFilePath });

export interface EnvConfig {
  baseurl: string;
  adminBaseurl: string;
  timezone: string;
  devseed: boolean;
  sitename: string;
  frontendPort: number;
  adminPort: number;
  backendPort: number;
  databaseType: string;
  databaseHost: string;
  databasePort: number;
  databaseUser: string;
  databasePassword: string;
  databaseName: string;
  jwtKey: string;
  jwtExpires: string;
  jwtRefreshExpires: string;
  trustProxy: boolean | number | string;
  corsOrigins: string[];
  apiBaseurl: string;
  discordClientID: string;
  discordclientSecret: string;
  recaptchaSecret: string;
  recaptchaPublic: string;
  recaptchaDisabled: boolean;
  vkLongpoll: boolean;
  vkApiKey: string;
  smtpService: string;
  smtpHost: string;
  smtpPort: number;
  smtpIgnoreTLS: boolean;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  mailFrom: string;

  anypayEnabled: boolean;
  anypayMerchantID: string;
  anypaySecretKey: string;

  centappEnabled: boolean;
  centappShopID: string;
  centappToken: string;

  enotioEnabled: boolean;
  enotioMerchantID: string;
  enotioSecretKey: string;
  enotioSecretKeySecond: string;

  freekassaEnabled: boolean;
  freekassaMerchantID: string;
  freekassaSecretKey: string;
  freekassaSecretKeySecond: string;

  payokEnabled: boolean;
  payokShopID: string;
  payokSecretKey: string;

  unitpayEnabled: boolean;
  unitpayPublicKey: string;
  unitpaySecretKey: string;

  mctopEnabled: boolean;
  topcraftEnabled: boolean;
  minecraftratingEnabled: boolean;
  mcrateEnabled: boolean;
  monitoringminecraftEnabled: boolean;

  mctopSecretKey: string;
  topcraftSecretKey: string;
  minecraftratingSecretKey: string;
  mcrateSecretKey: string;
  monitoringminecraftSecretKey: string;

  googleAnalyticsId: string;
  yandexMetrikaId: string;

  encryptionKey: string;
  encryptionKeyPrevious: string;

  passwordAlgorithm: string;
  passwordArgon2Memory: number;
  passwordArgon2Time: number;
  passwordArgon2Parallelism: number;
  passwordBcryptCost: number;

  realDecimals: number;
  virtualDecimals: number;
  ingameDecimals: number;

  colorModePreference: string;
  colorModeFallback: string;
}

const baseurl = env.get(PUBLIC_ENV_KEY.baseurl).required().asString();

const originWithPort = (url: string, port: number): string => {
  try {
    const parsed = new URL(url);
    parsed.port = String(port);
    return parsed.origin;
  } catch {
    return "";
  }
};

const adminBaseurl =
  env.get(PUBLIC_ENV_KEY.adminBaseurl).asString() ||
  originWithPort(baseurl, ports.adminPort);

const encryptionKey =
  env.get("ENCRYPTION_KEY").asString() ||
  env.get("JWT_KEY").required().asString();

const explicitCorsOrigins = env
  .get("CORS_ORIGINS")
  .default("")
  .asString()
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const timezone = env
  .get(PUBLIC_ENV_KEY.timezone)
  .default(DEFAULT_TIMEZONE)
  .asString()
  .trim();

if (!isValidTimezone(timezone))
  throw new Error(
    `TIMEZONE="${timezone}" is not a valid IANA timezone (e.g. UTC, Europe/Moscow).`,
  );

export const envConfig: EnvConfig = {
  // Хост приложения
  baseurl,
  adminBaseurl,
  timezone,
  devseed: env.get(PUBLIC_ENV_KEY.devseed).default(0).asBool(),

  sitename: env.get(PUBLIC_ENV_KEY.sitename).default("UnicoreCMS").asString(),

  // Порты
  frontendPort: ports.frontendPort,
  adminPort: ports.adminPort,
  backendPort: ports.backendPort,

  // URL REWRITES
  apiBaseurl: env.get(PUBLIC_ENV_KEY.apiBaseurl).required().asString(),

  // Настройки подключения к БД
  databaseType: env.get("DATABASE_TYPE").default("mysql").asString(),
  databaseHost: env.get("DATABASE_HOST").default("127.0.0.1").asString(),
  databasePort: env.get("DATABASE_PORT").default(3306).asPortNumber(),
  databaseUser: env.get("DATABASE_USER").asString(),
  databasePassword: env.get("DATABASE_PASSWORD").asString(),
  databaseName: env.get("DATABASE_NAME").required().asString(),

  encryptionKey,
  encryptionKeyPrevious: env
    .get("ENCRYPTION_KEY_PREVIOUS")
    .default("")
    .asString(),

  passwordAlgorithm: env
    .get("PASSWORD_ALGORITHM")
    .default(DEFAULT_PASSWORD_ALGORITHM)
    .asEnum(PASSWORD_ALGORITHMS),
  passwordArgon2Memory: env
    .get("PASSWORD_ARGON2_MEMORY")
    .default(DEFAULT_ARGON2_MEMORY)
    .asIntPositive(),
  passwordArgon2Time: env
    .get("PASSWORD_ARGON2_TIME")
    .default(DEFAULT_ARGON2_TIME)
    .asIntPositive(),
  passwordArgon2Parallelism: env
    .get("PASSWORD_ARGON2_PARALLELISM")
    .default(DEFAULT_ARGON2_PARALLELISM)
    .asIntPositive(),
  passwordBcryptCost: env
    .get("PASSWORD_BCRYPT_COST")
    .default(DEFAULT_BCRYPT_COST)
    .asIntPositive(),

  // JWT
  jwtKey: env.get("JWT_KEY").required().asString(),
  jwtExpires: env.get(PUBLIC_ENV_KEY.jwtExpires).default("5m").asString(),
  jwtRefreshExpires: env
    .get(PUBLIC_ENV_KEY.jwtRefreshExpires)
    .default("30d")
    .asString(),

  trustProxy: (() => {
    const raw = env.get("TRUST_PROXY").asString();
    if (!raw) return false;
    if (raw === "true") return true;
    if (raw === "false") return false;
    if (/^\d+$/.test(raw)) return Number(raw);
    return raw;
  })(),
  corsOrigins: explicitCorsOrigins.length
    ? explicitCorsOrigins
    : [...new Set([baseurl, adminBaseurl].filter(Boolean))],

  // RECAPTHA
  recaptchaSecret: env.get("RECAPTCHA_SECRET").default("").asString(),
  recaptchaDisabled: env.get("RECAPTCHA_DISABLED").default("false").asBool(),
  recaptchaPublic: env
    .get(PUBLIC_ENV_KEY.recaptchaPublic)
    .default("")
    .asString(),

  // OAUTH
  discordClientID: env.get("DISCORD_CLIENT_ID").asString(),
  discordclientSecret: env.get("DISCORD_CLIENT_SECRET").asString(),

  // VK Longpoll
  vkLongpoll: env.get("VK_LONGPOLL").default(0).asBool(),
  vkApiKey: env.get("VK_APIKEY").asString(),

  // SMTP
  mailFrom: env.get("MAIL_FROM").asString(),
  smtpService: env.get("SMTP_SERVICE").asString(),
  smtpHost: env.get("SMTP_HOST").asString(),
  smtpPort: env.get("SMTP_PORT").asPortNumber(),
  smtpIgnoreTLS: env.get("SMTP_IGNORE_TLS").asBool(),
  smtpSecure: env.get("SMTP_SECURE").asBool(),
  smtpUser: env.get("SMTP_USER").asString(),
  smtpPassword: env.get("SMTP_PASSWORD").asString(),

  // Payments
  anypayEnabled: env.get("ANYPAY_ENABLED").default(0).asBool(),
  anypayMerchantID: env.get("ANYPAY_MERCHANT_ID").asString(),
  anypaySecretKey: env.get("ANYPAY_SECRET_KEY").asString(),

  centappEnabled: env.get("CENTAPP_ENABLED").default(0).asBool(),
  centappShopID: env.get("CENTAPP_SHOP_ID").asString(),
  centappToken: env.get("CENTAPP_TOKEN").asString(),

  enotioEnabled: env.get("ENOTIO_ENABLED").default(0).asBool(),
  enotioMerchantID: env.get("ENOTIO_MERCHANT_ID").asString(),
  enotioSecretKey: env.get("ENOTIO_SECRET_KEY").asString(),
  enotioSecretKeySecond: env.get("ENOTIO_SECRET_KEY_SECOND").asString(),

  freekassaEnabled: env.get("FREEKASSA_ENABLED").default(0).asBool(),
  freekassaMerchantID: env.get("FREEKASSA_MERCHANT_ID").asString(),
  freekassaSecretKey: env.get("FREEKASSA_SECRET_KEY").asString(),
  freekassaSecretKeySecond: env.get("FREEKASSA_SECRET_KEY_SECOND").asString(),

  payokEnabled: env.get("PAYOK_ENABLED").default(0).asBool(),
  payokShopID: env.get("PAYOK_SHOP_ID").asString(),
  payokSecretKey: env.get("PAYOK_SECRET_KEY").asString(),

  unitpayEnabled: env.get("UNITPAY_ENABLED").default(0).asBool(),
  unitpayPublicKey: env.get("UNITPAY_PUBLIC_KEY").asString(),
  unitpaySecretKey: env.get("UNITPAY_SECRET_KEY").asString(),

  mctopEnabled: env.get("MCTOP_ENABLED").default(0).asBool(),
  topcraftEnabled: env.get("TOPCRAFT_ENABLED").default(0).asBool(),
  minecraftratingEnabled: env
    .get("MINECRAFTRATING_ENABLED")
    .default(0)
    .asBool(),
  mcrateEnabled: env.get("MCRATE_ENABLED").default(0).asBool(),
  monitoringminecraftEnabled: env
    .get("MONITORINGMINECRAFT_ENABLED")
    .default(0)
    .asBool(),

  mctopSecretKey: env.get("MCTOP_SECRET_KEY").asString(),
  topcraftSecretKey: env.get("TOPCRAFT_SECRET_KEY").asString(),
  minecraftratingSecretKey: env.get("MINECRAFTRATING_SECRET_KEY").asString(),
  mcrateSecretKey: env.get("MCRATE_SECRET_KEY").asString(),
  monitoringminecraftSecretKey: env
    .get("MONITORINGMINECRAFT_SECRET_KEY")
    .asString(),

  googleAnalyticsId: env.get(PUBLIC_ENV_KEY.googleAnalyticsId).asString(),
  yandexMetrikaId: env.get(PUBLIC_ENV_KEY.yandexMetrikaId).asString(),

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
};

const weakSecrets = [
  "qwerty123",
  "changeme",
  "secret",
  "password",
  "change_me",
];
const isProd = process.env.NODE_ENV === "production";

if (envConfig.jwtKey.length < 16 || weakSecrets.includes(envConfig.jwtKey)) {
  const message =
    "JWT_KEY is weak or a shipped default. Set a long random secret (>= 16 chars).";
  if (isProd) throw new Error(message);
  else console.warn("[SECURITY WARNING] " + message);
}

if (!env.get("ENCRYPTION_KEY").asString()) {
  const message =
    "ENCRYPTION_KEY is not set, data encryption key falls back to JWT_KEY. " +
    "Changing JWT_KEY without moving the old value to ENCRYPTION_KEY_PREVIOUS locks every user out.";
  if (isProd) throw new Error(message);
  else console.warn("[SECURITY WARNING] " + message);
}

if (!envConfig.recaptchaSecret && !envConfig.recaptchaDisabled) {
  const message =
    "RECAPTCHA_SECRET is empty, captcha on login, register and password reset is disabled. " +
    "Set RECAPTCHA_DISABLED=true to confirm this is intentional.";
  if (isProd) throw new Error(message);
  else console.warn("[SECURITY WARNING] " + message);
}

const requireSecrets = (
  enabled: boolean,
  name: string,
  keys: Record<string, string>,
) => {
  if (!enabled) return;
  const missing = Object.entries(keys)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length)
    throw new Error(
      `"${name}" is enabled but required secrets are missing: ${missing.join(", ")}`,
    );
};

requireSecrets(envConfig.anypayEnabled, "anypay", {
  ANYPAY_MERCHANT_ID: envConfig.anypayMerchantID,
  ANYPAY_SECRET_KEY: envConfig.anypaySecretKey,
});
requireSecrets(envConfig.centappEnabled, "centapp", {
  CENTAPP_SHOP_ID: envConfig.centappShopID,
  CENTAPP_TOKEN: envConfig.centappToken,
});
requireSecrets(envConfig.enotioEnabled, "enotio", {
  ENOTIO_MERCHANT_ID: envConfig.enotioMerchantID,
  ENOTIO_SECRET_KEY: envConfig.enotioSecretKey,
  ENOTIO_SECRET_KEY_SECOND: envConfig.enotioSecretKeySecond,
});
requireSecrets(envConfig.freekassaEnabled, "freekassa", {
  FREEKASSA_MERCHANT_ID: envConfig.freekassaMerchantID,
  FREEKASSA_SECRET_KEY: envConfig.freekassaSecretKey,
  FREEKASSA_SECRET_KEY_SECOND: envConfig.freekassaSecretKeySecond,
});
requireSecrets(envConfig.payokEnabled, "payok", {
  PAYOK_SHOP_ID: envConfig.payokShopID,
  PAYOK_SECRET_KEY: envConfig.payokSecretKey,
});
requireSecrets(envConfig.unitpayEnabled, "unitpay", {
  UNITPAY_PUBLIC_KEY: envConfig.unitpayPublicKey,
  UNITPAY_SECRET_KEY: envConfig.unitpaySecretKey,
});

requireSecrets(envConfig.mctopEnabled, "mctop", {
  MCTOP_SECRET_KEY: envConfig.mctopSecretKey,
});
requireSecrets(envConfig.topcraftEnabled, "topcraft", {
  TOPCRAFT_SECRET_KEY: envConfig.topcraftSecretKey,
});
requireSecrets(envConfig.minecraftratingEnabled, "minecraftrating", {
  MINECRAFTRATING_SECRET_KEY: envConfig.minecraftratingSecretKey,
});
requireSecrets(envConfig.mcrateEnabled, "mcrate", {
  MCRATE_SECRET_KEY: envConfig.mcrateSecretKey,
});
requireSecrets(envConfig.monitoringminecraftEnabled, "monitoringminecraft", {
  MONITORINGMINECRAFT_SECRET_KEY: envConfig.monitoringminecraftSecretKey,
});

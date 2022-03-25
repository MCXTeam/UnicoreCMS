import { from } from "env-var";
import { config } from "dotenv";
import { resolve } from "path";

const env = from(process.env);
config({ path: resolve(__dirname, "../../../.env") });

export interface EnvConfig {
  baseurl: string;
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
  apiBaseurl: string;
  discordClientID: string;
  discordclientSecret: string;
  recaptchaSecret: string;
  recaptchaPublic: string;
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

  anypayEnabled: boolean
  anypayMerchantID: string
  anypaySecretKey: string

  centappEnabled: boolean
  centappShopID: string
  centappToken: string

  enotioEnabled: boolean
  enotioMerchantID: string
  enotioSecretKey: string
  enotioSecretKeySecond: string

  freekassaEnabled: boolean
  freekassaMerchantID: string
  freekassaSecretKey: string
  freekassaSecretKeySecond: string

  payokEnabled: boolean
  payokShopID: string
  payokSecretKey: string

  qiwiEnabled: boolean
  qiwiPublicKey: string
  qiwiSecretKey: string

  unitpayEnabled: boolean
  unitpayPublicKey: string
  unitpaySecretKey: string
}

export const envConfig: EnvConfig = {
  // Хост приложения
  baseurl: env.get("BASEURL").required().asString(),
  devseed: env.get("DEV_SEED").default(0).asBool(),

  sitename: env.get("SITENAME").default("UnicoreCMS").asString(),

  // Порты
  frontendPort: env.get("CLIENT_PORT").default(3000).asPortNumber(),
  adminPort: env.get("ADMIN_PORT").default(4000).asPortNumber(),
  backendPort: env.get("SERVER_PORT").default(5000).asPortNumber(),

  // URL REWRITES
  apiBaseurl: env.get("API_BASEURL").required().asString(),

  // Настройки подключения к БД
  databaseType: env.get("DATABASE_TYPE").default("mysql").asString(),
  databaseHost: env.get("DATABASE_HOST").default("127.0.0.1").asString(),
  databasePort: env.get("DATABASE_PORT").default(3306).asPortNumber(),
  databaseUser: env.get("DATABASE_USER").asString(),
  databasePassword: env.get("DATABASE_PASSWORD").asString(),
  databaseName: env.get("DATABASE_NAME").required().asString(),

  // JWT
  jwtKey: env.get("JWT_KEY").required().asString(),
  jwtExpires: env.get("JWT_EXPIRES").default("5m").asString(),
  jwtRefreshExpires: env.get("JWT_REFRESH_EXPIRES").default("30d").asString(),

  // RECAPTHA
  recaptchaSecret: env.get("RECAPTCHA_SECRET").required().asString(),
  recaptchaPublic: env.get("RECAPTCHA_PUBLIC").required().asString(),

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

  qiwiEnabled: env.get("QIWI_ENABLED").default(0).asBool(),
  qiwiPublicKey: env.get("QIWI_PUBLIC_KEY").asString(),
  qiwiSecretKey: env.get("QIWI_SECRET_KEY").asString(),

  unitpayEnabled: env.get("UNITPAY_ENABLED").default(0).asBool(),
  unitpayPublicKey: env.get("UNITPAY_PUBLIC_KEY").asString(),
  unitpaySecretKey: env.get("UNITPAY_SECRET_KEY").asString(),
};

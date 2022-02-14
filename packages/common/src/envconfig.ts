import { from } from "env-var";
import { config } from "dotenv";
import { resolve } from "path";

const env = from(process.env);
config({ path: resolve(__dirname, "../../../.env") });

export interface EnvConfig {
  baseurl: string;
  name: string;
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
  smtpIgnoreTLS: boolean
  smtpSecure: boolean
  smtpUser: string
  smtpPassword: string
}

export const envConfig: EnvConfig = {
  // Хост приложения
  baseurl: env.get("BASEURL").required().asString(),

  name: env.get("NAME").default("UnicoreCMS").asString(),

  // Порты
  frontendPort: env.get("FRONTEND_PORT").default(3000).asPortNumber(),
  adminPort: env.get("ADMIN_PORT").default(4000).asPortNumber(),
  backendPort: env.get("BACKEND_PORT").default(5000).asPortNumber(),

  // URL REWRITES
  apiBaseurl: env.get("API_BASEURL").required().asString(),

  // Настройки подключения к БД
  databaseType: env.get("DATABASE_TYPE").default("mysql").asString(),
  databaseHost: env.get("DATABASE_HOST").default("127.0.0.1").asString(),
  databasePort: env.get("DATABASE_PORT").default(3306).asPortNumber(),
  databaseUser: env.get("DATABASE_USER").required().asString(),
  databasePassword: env.get("DATABASE_PASSWORD").required().asString(),
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
  smtpService: env.get("SMTP_SERVICE").asString(),
  smtpHost: env.get("SMTP_HOST").asString(),
  smtpPort: env.get("SMTP_PORT").asPortNumber(),
  smtpIgnoreTLS: env.get("SMTP_IGNORE_TLS").asBool(),
  smtpSecure: env.get("SMTP_SECURE").asBool(),
  smtpUser: env.get("SMTP_USER").asString(),
  smtpPassword: env.get("SMTP_PASSWORD").asString(),
};

import { envConfig } from "unicore-common";
import { NamingStrategy } from "./common/database";

export const ormconfig: any = {
  type: envConfig.databaseType,
  host: envConfig.databaseHost,
  port: envConfig.databasePort,
  username: envConfig.databaseUser,
  password: envConfig.databasePassword,
  database: envConfig.databaseName,
  entities: ['./**/*.entity.js'],
  seeds: ['dist/seeds/*.js'],
  factories: ['dist/factories/*.js'],
  namingStrategy: new NamingStrategy(),
}

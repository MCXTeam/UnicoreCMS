import { envConfig, timezoneOffset } from 'unicore-common';
import { NamingStrategy } from './common/database';
import { SCHEMA_MIGRATIONS_TABLE } from './common/constants';
import { moduleEntities } from './modules/runtime';

const importAllFunctions = (
  // @ts-ignore
  requireContext: __WebpackModuleApi.RequireContext,
) =>
  requireContext
    .keys()
    .sort()
    .map((filename) => {
      const required = requireContext(filename);
      return Object.keys(required).reduce((result, exportedKey) => {
        const exported = required[exportedKey];
        if (typeof exported === 'function') {
          return result.concat(exported);
        }
        return result;
      }, [] as any);
    })
    .flat();

const importEntities = () => {
  try {
    // @ts-ignore
    const imports = importAllFunctions(require.context('.', true, /\.entity\.ts$/));
    return imports;
  } catch {
    return ['./**/*.entity.js'];
  }
};

const importMigrations = () => {
  try {
    // @ts-ignore
    return importAllFunctions(require.context('./migrations/steps', true, /\.migration\.ts$/));
  } catch {
    return ['./migrations/steps/*.migration.js'];
  }
};

export const ormconfig: any = {
  type: envConfig.databaseType,
  host: envConfig.databaseHost,
  port: envConfig.databasePort,
  username: envConfig.databaseUser,
  password: envConfig.databasePassword,
  database: envConfig.databaseName,
  timezone: timezoneOffset(envConfig.timezone),
  entities: [...importEntities(), ...moduleEntities()],
  migrations: importMigrations(),
  migrationsTableName: SCHEMA_MIGRATIONS_TABLE,
  namingStrategy: new NamingStrategy(),
};

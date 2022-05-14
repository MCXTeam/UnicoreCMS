import { envConfig } from 'unicore-common';
import { NamingStrategy } from './common/database';

const importAllFunctions = (
  // @ts-ignore
  requireContext: __WebpackModuleApi.RequireContext
) =>
  requireContext
    .keys()
    .sort()
    .map((filename) => {
      const required = requireContext(filename);
      return Object.keys(required).reduce((result, exportedKey) => {
        const exported = required[exportedKey];
        if (typeof exported === "function") {
          return result.concat(exported);
        }
        return result;
      }, [] as any);
    })
    .flat();

export const ormconfig: any = {
  type: envConfig.databaseType,
  host: envConfig.databaseHost,
  port: envConfig.databasePort,
  username: envConfig.databaseUser,
  password: envConfig.databasePassword,
  database: envConfig.databaseName,
  timezone: 'Z',
  // @ts-ignore
  entities: importAllFunctions(require.context('.', true, /\.entity\.ts$/)),
  // @ts-ignore
  seeds: importAllFunctions(require.context('./seeds', true, /\.ts$/)),
  namingStrategy: new NamingStrategy(),
};

import { DataSource } from 'typeorm';
import { envConfig, timezoneOffset } from 'unicore-common';

interface PoolLike {
  on?: (event: string, listener: (connection: { query: (sql: string) => unknown }) => void) => void;
}

export const sessionTimezoneSql = (): string => `SET time_zone = '${timezoneOffset(envConfig.timezone)}'`;

export const enforceSessionTimezone = async (dataSource: DataSource): Promise<DataSource> => {
  const { type } = dataSource.options;
  if (type !== 'mysql' && type !== 'mariadb') return dataSource;

  const pool = (dataSource.driver as unknown as { pool?: PoolLike }).pool;
  pool?.on?.('connection', (connection) => connection.query(sessionTimezoneSql()));

  await dataSource.query(sessionTimezoneSql());

  return dataSource;
};

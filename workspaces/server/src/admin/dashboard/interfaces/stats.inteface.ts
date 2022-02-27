import { StatInterface } from './stat.interface';

export interface StatsInterface {
  payments: StatInterface;
  purchases: StatInterface;
  online_records: StatInterface;
  users: StatInterface;
}

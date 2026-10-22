import { RecordsOnlineInterface } from './record-online.interface';

export interface TotalOnlineInterface {
  online: number | null;

  aggregation?: 'unique' | 'count-only' | 'mixed';

  freshness?: 'fresh' | 'stale';

  records: RecordsOnlineInterface;
}

import { Online } from '../entities/online.entity';
import { TotalOnlineInterface } from '../interfaces/total-online.interface';

export class Onlines {
  servers: Online[];

  total: TotalOnlineInterface;
}

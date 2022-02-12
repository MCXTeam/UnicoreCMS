import { Server } from '../../entities/server.entity';

export interface UpdateOnline {
  instance: Server;
  updated: boolean;
}

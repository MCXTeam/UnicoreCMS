import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { WS_PUBLIC_ROOM } from '@common';
import { kernelServerRoom, userRoom } from 'src/auth/helpers';

@Injectable()
export class EventsService {
  public server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  emitKernel(event: string, payload: unknown, serverId?: string | number | null): void {
    if (!this.server) return;

    const rooms: string[] = ['kernel.connect'];

    if (serverId !== undefined && serverId !== null && serverId !== '') rooms.push(kernelServerRoom(serverId));

    this.server.to(rooms).emit(event, payload);
  }

  emitPublic(event: string, payload?: unknown): void {
    if (!this.server) return;

    this.server.to(WS_PUBLIC_ROOM).emit(event, payload);
  }

  emitUser(uuid: string, event: string, payload?: unknown): void {
    if (!this.server || !uuid) return;

    this.server.to(userRoom(uuid)).emit(event, payload);
  }
}

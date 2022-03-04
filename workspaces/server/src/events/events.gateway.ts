import { ClassSerializerInterceptor, Injectable, Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { instanceToPlain } from 'class-transformer';
import { Server } from 'socket.io';
import { PermissionGuard } from 'src/admin/roles/guards/permisson.guard';
import { UserDto } from 'src/admin/users/dto/user.dto';
import { AuthSocket } from 'src/auth/interfaces/auth-socket.interface';
import { Onlines } from 'src/game/servers/online/dto/onlines.dto';
import { OnlineService } from 'src/game/servers/online/online.service';
import { GravitService } from '../auth/gravit/gravit.service';
import { EventsService } from './events.service';

@Injectable()
@UseGuards(PermissionGuard)
@UseInterceptors(ClassSerializerInterceptor)
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection {
  private logger = new Logger(EventsGateway.name);
  // private gravitService: GravitService

  constructor(
    // private lazyModuleLoader: LazyModuleLoader,
    private eventsService: EventsService,
    private onlineService: OnlineService,
  ) { }

  @WebSocketServer()
  server: Server;

  async afterInit() {
    // Server instance
    this.eventsService.server = this.server;

    // Lazy loader
    // const { GravitModule } = await import('../auth/gravit/gravit.module');
    // const moduleRef = await this.lazyModuleLoader.load(() => GravitModule);
    // this.gravitService = await moduleRef.resolve(GravitService)
    

    this.logger.log('WebSockets server is initialized and running');
  }

  handleConnection(socket: AuthSocket) {
    if (socket.user)
      this.server.to(socket.id).emit("me", instanceToPlain(new UserDto(socket.user)))
    else
      this.server.to(socket.id).emit("me", null)
  }

  @SubscribeMessage('servers/online')
  handleOnline(): Promise<Onlines> {
    return this.onlineService.find();
  }
}

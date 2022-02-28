import { ClassSerializerInterceptor, forwardRef, Inject, Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Socket } from 'dgram';
import { Server } from 'socket.io';
import { UserDto } from 'src/admin/users/dto/user.dto';
import { AuthService } from 'src/auth/auth.service';
import { GravitUserDto } from 'src/auth/gravit/dto/gravit-user.dto';
import { GravitModule } from 'src/auth/gravit/gravit.module';
import { GravitService } from 'src/auth/gravit/gravit.service';
import { AuthSocket } from 'src/auth/interfaces/auth-socket.interface';
import { Onlines } from 'src/game/servers/online/dto/onlines.dto';
import { OnlineService } from 'src/game/servers/online/online.service';
import { EventsService } from './events.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection {
  private logger = new Logger(EventsGateway.name);

  constructor(
    private eventsService: EventsService, 
    private onlineService: OnlineService,
    private gravitService: GravitService
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.eventsService.server = this.server;
    this.logger.log('WebSocket server is initialized and running');
  }

  handleConnection(socket: AuthSocket) {
    if (socket.user)
      this.server.to(socket.id).emit("me", new UserDto(socket.user))
    else
      this.server.to(socket.id).emit("me", null)
  }

  @SubscribeMessage('servers/online')
  handleOnline(): Promise<Onlines> {
    return this.onlineService.find();
  }

  // Gravit (UnicoreProvider)

  @UseInterceptors(ClassSerializerInterceptor)
  @SubscribeMessage('unicoreprovider/getUserByLogin')
  async handleGravitTest(): Promise<GravitUserDto> {
    return this.gravitService.getUserByLogin("admin")
  }
}

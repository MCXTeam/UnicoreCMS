import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Onlines } from 'src/game/servers/online/dto/onlines.dto';
import { OnlineService } from 'src/game/servers/online/online.service';
import { EventsService } from './events.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit {
  private logger = new Logger(EventsGateway.name);

  constructor(private eventsService: EventsService, private onlineService: OnlineService) {}

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.eventsService.server = this.server;
    this.logger.log('WebSocket server is initialized and running');
  }

  @SubscribeMessage('servers/online')
  handleOnline(): Promise<Onlines> {
    return this.onlineService.find();
  }
}

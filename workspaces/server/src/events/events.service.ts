import { Injectable } from '@nestjs/common';
import { MessageBody, SubscribeMessage } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UserDto } from 'src/admin/users/dto/user.dto';
import UsersModule from 'src/admin/users/users.module';
import { UsersService } from 'src/admin/users/users.service';
import { WebhooksService } from 'src/admin/webhook/webhooks.service';
import { AuthService } from 'src/auth/auth.service';
import { GravitService } from 'src/auth/gravit/gravit.service';
import { userRoom } from 'src/auth/helpers';
import { AuthSocket } from 'src/auth/interfaces/auth-socket.interface';

@Injectable()
export class EventsService {
  public server: Server;

  setServer(server: Server) {
    this.server = server
  }
}

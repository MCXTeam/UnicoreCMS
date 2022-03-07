import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ApiService } from 'src/admin/api/api.service';
import { UserDto } from 'src/admin/users/dto/user.dto';
import { UsersService } from 'src/admin/users/users.service';
import { userRoom } from '../helpers';
import { ApiKeyRoom } from '../helpers/api-key-room';
import { AuthSocket } from '../interfaces/auth-socket.interface';
import { TokensService } from '../tokens.service';

export class AuthAdapter extends IoAdapter {
  private tokensService: TokensService;
  private apiService: ApiService;
  private usersService: UsersService;

  constructor(private app: INestApplicationContext) {
    super(app);
    app.resolve<TokensService>(TokensService).then((tokensService) => {
      this.tokensService = tokensService;
    });
    app.resolve<UsersService>(UsersService).then((usersService) => {
      this.usersService = usersService;
    });
    app.resolve<ApiService>(ApiService).then((apiService) => {
      this.apiService = apiService;
    });
  } 

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    server.use(async (socket: AuthSocket, next) => {
      if (socket.handshake.headers?.authorization) {
        try {
          if (socket.handshake.headers?.authorization?.startsWith("Api-Key ")) {
            const apiToken = await this.apiService.findOne(socket.handshake.headers?.authorization.slice(8))
            const user = await this.usersService.getKernel()
            user.perms = apiToken.perms
            socket.join([...new UserDto(user).perms, userRoom(user), ApiKeyRoom(apiToken)])
            socket.user = user; 
          } else {
            const { user } = await this.tokensService.resolveRefreshToken(socket.handshake.query.token as string);
            socket.join([...user.perms, userRoom(user)])
            socket.user = user; 
          }
        } catch {
          socket.join('public');
        }
      } else {
        socket.join('public');
      }
      next();
    });
    return server;
  }
}

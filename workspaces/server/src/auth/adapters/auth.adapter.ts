import { INestApplicationContext, UnauthorizedException } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ApiService } from 'src/admin/api/api.service';
import { UserDto } from 'src/admin/users/dto/user.dto';
import { UsersService } from 'src/admin/users/users.service';
import { User } from 'src/admin/users/entities/user.entity';
import { ApiToken } from 'src/admin/api/entities/api-token.entity';
import { Permission } from 'unicore-common';
import { kernelServerRoom, userRoom } from '../helpers';
import { ApiKeyRoom } from '../helpers/api-key-room';
import { AuthSocket } from '../interfaces/auth-socket.interface';
import { TokensService } from '../tokens.service';
import { handshakeIp, ipAllowed, isBanActive, WS_API_KEY_PREFIX, WS_BEARER_PREFIX, WS_PUBLIC_ROOM } from '@common';

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

  private apiKeyFromHandshake(handshake: AuthSocket['handshake']): string | null {
    const authorization = handshake.headers?.authorization;

    return authorization?.startsWith(WS_API_KEY_PREFIX) ? authorization.slice(WS_API_KEY_PREFIX.length) : null;
  }

  private refreshTokenFromHandshake(handshake: AuthSocket['handshake']): string | null {
    const fromAuth = (handshake.auth as Record<string, unknown> | undefined)?.token;
    if (typeof fromAuth === 'string' && fromAuth) return fromAuth;

    const authorization = handshake.headers?.authorization;

    return authorization?.startsWith(WS_BEARER_PREFIX) ? authorization.slice(WS_BEARER_PREFIX.length) : null;
  }

  private socketIp(socket: AuthSocket): string {
    return handshakeIp({
      address: socket.handshake.address || socket.conn?.remoteAddress,
      headers: socket.handshake.headers,
    });
  }

  private kernelRooms(apiToken: ApiToken, user: User): string[] {
    const perms = new UserDto(user).perms;

    if (!apiToken.servers?.length) return perms;

    return [
      ...perms.filter((perm) => perm !== Permission.KernelUnicoreConnect),
      ...apiToken.servers.map((server) => kernelServerRoom(server)),
    ];
  }

  private async authorizeApiKey(socket: AuthSocket, apiKey: string): Promise<void> {
    const apiToken = await this.apiService.findByKey(apiKey);

    if (!ipAllowed(this.socketIp(socket), apiToken?.allow)) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.getKernel();
    user.perms = apiToken.perms;

    socket.join([...this.kernelRooms(apiToken, user), userRoom(user), ApiKeyRoom(apiToken)]);
    socket.user = user;
  }

  private async authorizeUser(socket: AuthSocket, refreshToken: string): Promise<void> {
    const { user } = await this.tokensService.resolveRefreshToken(refreshToken);

    if (isBanActive(user.ban)) throw new UnauthorizedException();

    socket.join([...new UserDto(user).perms, userRoom(user)]);
    socket.user = user;
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);

    server.use(async (socket: AuthSocket, next) => {
      const apiKey = this.apiKeyFromHandshake(socket.handshake);
      const refreshToken = apiKey ? null : this.refreshTokenFromHandshake(socket.handshake);

      try {
        if (apiKey) await this.authorizeApiKey(socket, apiKey);
        else if (refreshToken) await this.authorizeUser(socket, refreshToken);
        else socket.join(WS_PUBLIC_ROOM);
      } catch {
        socket.join(WS_PUBLIC_ROOM);
      }

      next();
    });

    return server;
  }
}

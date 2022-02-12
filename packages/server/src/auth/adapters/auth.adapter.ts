import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AuthSocket } from '../interfaces/auth-socket.interface';
import { TokensService } from '../tokens.service';

export class AuthAdapter extends IoAdapter {
  private tokensService: TokensService;

  constructor(private app: INestApplicationContext) {
    super(app);
    app.resolve<TokensService>(TokensService).then((tokensService) => {
      this.tokensService = tokensService;
    });
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    server.use(async (socket: AuthSocket, next) => {
      if (socket.handshake.headers?.authorization) {
        try {
          const { user } = await this.tokensService.resolveRefreshToken(socket.handshake.query.token as string);
          socket.user = user;
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

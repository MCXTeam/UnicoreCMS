import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { ApiService } from 'src/admin/api/api.service';
import { UsersService } from 'src/admin/users/users.service';
import * as requestIp from 'request-ip';
import { Request } from 'express';
import { ipAllowed } from '@common';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy) {
  constructor(private usersService: UsersService, private apiService: ApiService) {
    super(
      {
        header: 'Authorization',
        prefix: 'Api-Key ',
      },
      true,
      // @ts-expect-error @nestjs/passport strips the verify callback from the constructor type, but passport-headerapikey requires it at runtime
      async (apiKey, done, req) => {
        return this.validate(apiKey, done, req);
      },
    );
  }

  async validate(apiKey: string, done: (error: Error, data) => {}, req: Request) {
    const api = await this.apiService.findByKey(apiKey);
    const kernel = await this.usersService.getKernel();
    const ip = req.ip || requestIp.getClientIp(req);

    if (api && kernel && ipAllowed(ip, api.allow)) {
      kernel.perms = api.perms;

      done(null, kernel);
      return;
    }

    done(new UnauthorizedException(), null);
  }
}

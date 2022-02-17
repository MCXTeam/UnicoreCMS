import { Inject, Injectable, Scope, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { HeaderAPIKeyStrategy } from "passport-headerapikey";
import { ApiService } from "src/admin/api/api.service";
import { UsersService } from "src/admin/users/users.service";
import * as requestIp from 'request-ip';
import * as minimath from 'minimatch';
import { REQUEST } from "@nestjs/core";
import { Request } from 'express'

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy) {
  constructor(
    private usersService: UsersService,
    private apiService: ApiService
  ) {
    super(
      {
        header: 'Authorization',
        prefix: 'Api-Key ',
      },
      true,
      async (apiKey, done, req) => {
        return this.validate(apiKey, done, req);
      });
  }

  async validate(apiKey: string, done: (error: Error, data) => {}, req: Request) {
    const api = await this.apiService.findOne(apiKey)
    const kernel = await this.usersService.getKernel();
    const ip = requestIp.getClientIp(req)

    if (
      api &&
      kernel &&
      api.allow &&
      api.allow.length &&
      api.allow.filter(ipPattern => minimath.match([ip], ipPattern).length).flat().length
    ) {
      kernel.perms = api.perms
      
      done(null, kernel);
    }

    done(new UnauthorizedException(), null);
  }
}
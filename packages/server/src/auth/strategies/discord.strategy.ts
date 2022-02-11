import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';
import { envConfig } from 'unicore-common';
import { OauthProvider } from './oauth-providers';

@Injectable()
export class DiscordStrategy extends PassportStrategy(
  Strategy,
  OauthProvider.Discord,
) {
  constructor() {
    super({
      clientID: envConfig.discordClientID,
      clientSecret: envConfig.discordclientSecret,
      callbackURL: 'callbackURL',
      scope: ['identify', 'email'],
    });
  }

  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ) {}
}

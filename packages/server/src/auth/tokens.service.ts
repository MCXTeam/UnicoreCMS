import { UnprocessableEntityException, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { envConfig } from 'unicore-common';
import { RefreshToken } from './entities/refresh-token.entity';
import { JWTPayload, JWTRefreshPayload } from './interfaces/jwt-payload';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedDto } from './dto/authenticated.dto';
import { InjectRepository } from '@nestjs/typeorm';
import * as ms from 'ms';
import { MomentWrapper } from '@common';

@Injectable()
export class TokensService {
  constructor(
    @Inject('moment')
    private moment: MomentWrapper,
    @InjectRepository(RefreshToken)
    private tokensRepository: Repository<RefreshToken>,
    private usersService: UsersService,
    private jwt: JwtService,
  ) {}

  async generateAccessToken(user: User): Promise<string> {
    const payload: JWTPayload = {
      sub: user.uuid,
    };

    return this.jwt.sign(payload, {
      expiresIn: envConfig.jwtExpires,
    });
  }

  async generateRefreshToken(user: User, agent?: string, ip?: string): Promise<string> {
    const expires = this.moment().add(ms(envConfig.jwtRefreshExpires), 'milliseconds').local().toDate();
    const token = await this.tokensRepository.save({
      agent,
      ip,
      user,
      expires,
    });

    const payload: JWTRefreshPayload = {
      sub: user.uuid,
      jwtid: token.uuid,
    };

    return this.jwt.signAsync(payload, {
      expiresIn: envConfig.jwtRefreshExpires,
    });
  }

  async updateRefreshToken(user: User, refreshToken: RefreshToken, ip?: string): Promise<string> {
    const uuid = uuidv4();

    await this.tokensRepository
      .createQueryBuilder()
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ uuid, ip })
      .where('uuid = :uuid', { uuid: refreshToken.uuid })
      .execute();

    const payload: JWTRefreshPayload = {
      sub: user.uuid,
      jwtid: uuid,
    };

    return this.jwt.signAsync(payload, {
      expiresIn: envConfig.jwtRefreshExpires,
    });
  }

  async decodeRefreshToken(token: string): Promise<JWTRefreshPayload> {
    try {
      return this.jwt.verifyAsync(token);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new UnprocessableEntityException('Refresh token expired');
      } else {
        throw new UnprocessableEntityException('Refresh token malformed');
      }
    }
  }

  async resolveRefreshToken(encoded: string): Promise<{ user: User; token: RefreshToken }> {
    const payload = await this.decodeRefreshToken(encoded);
    const token = await this.tokensRepository.findOne({
      uuid: payload.jwtid,
      expires: MoreThanOrEqual(this.moment().toDate()),
    });

    if (!token) {
      throw new UnprocessableEntityException('Refresh token not found');
    }

    const user = await this.usersService.getById(payload.sub, ['skin', 'cloak', 'roles']);

    if (!user) {
      throw new UnprocessableEntityException('Refresh token malformed');
    }

    return { user, token };
  }

  async createTokensFromRefreshToken(refresh: string, agent?: string, ip?: string): Promise<Omit<AuthenticatedDto, 'user'>> {
    const { token, user } = await this.resolveRefreshToken(refresh);

    if (agent != token.agent) {
      throw new UnauthorizedException();
    }

    const refreshToken = await this.updateRefreshToken(user, token, ip);
    const accessToken = await this.generateAccessToken(user);

    return { refreshToken, accessToken };
  }

  async revokeRefreshToken(encoded: string): Promise<void> {
    const payload = await this.decodeRefreshToken(encoded);
    const token = await this.tokensRepository.findOne({
      uuid: payload.jwtid,
    });

    if (token && payload) {
      await this.tokensRepository.remove(token);
    }
  }
}

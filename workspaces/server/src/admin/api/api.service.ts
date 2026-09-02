import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiInput } from './dto/api.input';
import { ApiToken } from './entities/api-token.entity';

import { EventsService } from 'src/events/events.service';
import { ApiKeyRoom } from 'src/auth/helpers';
import { API_KEY_HASH, API_KEY_LENGTH, randomId } from '@common';
import { createHash } from 'crypto';

@Injectable()
export class ApiService {
  constructor(
    @InjectRepository(ApiToken)
    private apiTokensRepository: Repository<ApiToken>,
    private eventsService: EventsService,
  ) {}

  find(): Promise<ApiToken[]> {
    return this.apiTokensRepository.find();
  }

  findOne(secret: string): Promise<ApiToken> {
    return this.apiTokensRepository.findOneBy({ secret });
  }

  findByKey(key: string): Promise<ApiToken> {
    return this.findOne(ApiService.digest(key));
  }

  static digest(key: string): string {
    return createHash(API_KEY_HASH).update(key).digest('hex');
  }

  async create(input: ApiInput) {
    const key = randomId(API_KEY_LENGTH);
    const apikey = new ApiToken();

    apikey.secret = ApiService.digest(key);
    apikey.hint = key.slice(0, 6);
    apikey.comment = input.comment;
    apikey.allow = input.allow;
    apikey.perms = input.perms;
    apikey.servers = input.servers;

    return { ...(await this.apiTokensRepository.save(apikey)), key };
  }

  async update(secret: string, input: ApiInput) {
    const apikey = await this.findOne(secret);

    if (!apikey) {
      throw new NotFoundException();
    }

    apikey.comment = input.comment;
    apikey.allow = input.allow;
    apikey.perms = input.perms;
    apikey.servers = input.servers;

    this.eventsService.server.to(ApiKeyRoom(apikey)).disconnectSockets();
    return this.apiTokensRepository.save(apikey);
  }

  async remove(secret: string) {
    const apikey = await this.findOne(secret);

    if (!apikey) {
      throw new NotFoundException();
    }

    this.eventsService.server.to(ApiKeyRoom(apikey)).disconnectSockets();
    return this.apiTokensRepository.remove(apikey);
  }
}

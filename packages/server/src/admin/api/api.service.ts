import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiInput } from "./dto/api.input";
import { ApiToken } from "./entities/api-token.entity";
import { nanoid } from 'nanoid';

@Injectable()
export class ApiService {
  constructor(
    @InjectRepository(ApiToken)
    private apiTokensRepository: Repository<ApiToken>,
  ) {}

  find(): Promise<ApiToken[]> {
    return this.apiTokensRepository.find()
  }

  findOne(secret: string): Promise<ApiToken> {
    return this.apiTokensRepository.findOne(secret)
  }

  create(input: ApiInput) {
    const apikey = new ApiToken();

    apikey.secret = nanoid(64);
    apikey.allow = input.allow
    apikey.perms = input.perms

    return this.apiTokensRepository.save(apikey);
  }

  async update(secret: string, input: ApiInput) {
    const apikey = await this.findOne(secret);

    if (!apikey) {
      throw new NotFoundException();
    }

    apikey.allow = input.allow
    apikey.perms = input.perms

    return this.apiTokensRepository.save(apikey);
  }

  async remove(secret: string) {
    const apikey = await this.findOne(secret);

    if (!apikey) {
      throw new NotFoundException();
    }

    return this.apiTokensRepository.remove(apikey);
  }
}
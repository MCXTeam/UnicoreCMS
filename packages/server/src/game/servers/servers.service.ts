import { StorageManager } from '@common';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MulterFile } from 'fastify-file-interceptor';
import { In, Repository } from 'typeorm';
import { ServerCreateInput } from './dto/server-create.input';
import { ServerUpdateInput } from './dto/server-update.input';
import { Server } from './entities/server.entity';
import { ServerMedia } from './enums/server-media.enum';
import { Mod } from './mods/entities/mod.entity';
import { Online } from './online/entities/online.entity';
import { Query } from './online/entities/query.entity';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Server)
    private serversRepository: Repository<Server>,
    @InjectRepository(Mod)
    private modsRepository: Repository<Mod>,
    @InjectRepository(Query)
    private queryRepository: Repository<Query>,
  ) { }

  find(relations: string[] = new Array()): Promise<Server[]> {
    return this.serversRepository.find({ relations })
  }

  findOne(id: string, relations?: string[]): Promise<Server> {
    return this.serversRepository.findOne(id, { relations })
  }

  async create(input: ServerCreateInput): Promise<Server> {
    if (await this.findOne(input.id)) {
      throw new ConflictException()
    }

    const server = new Server()

    server.id = input.id
    server.name = input.name
    server.version = input.version
    server.slogan = input.slogan
    server.description = input.description

    server.online = new Online()
    server.query = new Query()
    server.query.host = input.query.host
    server.query.port = input.query.port

    server.mods = await this.modsRepository.find({
      id: In(input.mods)
    })

    // server.query = await this.queryRepository.save(server.query)
    return this.serversRepository.save(server)
  }

  async update(id: string, input: ServerUpdateInput): Promise<Server> {
    const server = await this.findOne(id, ['query'])

    if (!server) {
      throw new NotFoundException()
    }

    server.name = input.name
    server.version = input.version
    server.slogan = input.slogan
    server.description = input.description

    server.query.host = input.query.host
    server.query.port = input.query.port

    server.mods = await this.modsRepository.find({
      id: In(input.mods)
    })

    return this.serversRepository.save(server)
  }

  async remove(id: string) {
    const server = await this.findOne(id)

    if (!server) {
      throw new NotFoundException()
    }

    return this.serversRepository.remove(server)
  }

  async updateMedia(id: string, type: ServerMedia, file: MulterFile) {
    const server = await this.findOne(id)

    if (!server) {
      StorageManager.remove(file.filename);
      throw new NotFoundException()
    }

    StorageManager.remove(server[type]);
    server[type] = file.filename

    return this.serversRepository.save(server)
  }

  async removeMedia(id: string, type: ServerMedia) {
    const server = await this.findOne(id)

    if (!server) {
      throw new NotFoundException()
    }

    StorageManager.remove(server[type]);
    server[type] = null

    return this.serversRepository.save(server)
  }
}

import { assertFieldAccess } from 'src/admin/roles/field-permissions';
import { encryptField, ENCRYPTED_RCON_PASSWORD, NumberSortInput, SERVER_GALLERY_MAX_IMAGES, StorageManager, StringSortInput } from '@common';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeliveryMode } from 'unicore-common';
import { In, Repository } from 'typeorm';
import { ServerCreateInput } from './dto/server-create.input';
import { ServerUpdateInput } from './dto/server-update.input';
import { GalleryImageInput } from './dto/gallery.input';
import { ServerGalleryImage } from './entities/server-gallery.entity';
import { ServerInstance } from './entities/server-instance.entity';
import { ServerTable } from './entities/server-table.entity';
import { Server } from './entities/server.entity';
import { ServerMedia } from './enums/server-media.enum';
import { Mod } from './mods/entities/mod.entity';
import { Online } from './online/entities/online.entity';
import { Query } from './online/entities/query.entity';
import { RCON } from './rcon/entities/rcon.entity';
import { RconService } from './rcon/rcon.service';

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(Server)
    private serversRepository: Repository<Server>,
    @InjectRepository(Mod)
    private modsRepository: Repository<Mod>,
    @InjectRepository(ServerGalleryImage)
    private galleryRepository: Repository<ServerGalleryImage>,
    private rconService: RconService,
  ) {}

  find(relations: string[] = new Array()): Promise<Server[]> {
    return this.serversRepository.find({ relations });
  }

  findOne(id: string, relations?: string[]): Promise<Server> {
    return this.serversRepository.findOne({ where: { id }, relations });
  }

  async sort(input: StringSortInput) {
    const servers = await this.serversRepository.findBy({ id: In(input.items.map((srv) => srv.id)) });

    return this.serversRepository.save(
      servers.map((srv) => {
        const updatedSort = input.items.find((sr) => sr.id == srv.id);

        if (updatedSort) return { ...srv, priority: updatedSort.priority };

        return srv;
      }),
    );
  }

  async create(input: ServerCreateInput, request?: any): Promise<Server> {
    await assertFieldAccess('server', input, null, request);
    if (await this.findOne(input.id)) {
      throw new ConflictException();
    }

    const server = new Server();

    server.id = input.id;
    server.name = input.name;
    server.version = input.version;
    server.slogan = input.slogan;
    server.description = input.description;
    server.content = input.content;
    server.wipe = input.wipe ?? false;
    server.table = (input.table ?? []).map((row, index) => ({ ...row, priority: index } as ServerTable));
    server.instances = (input.instances ?? []).map((instance, index) => ({ ...instance, priority: index } as ServerInstance));

    server.online = new Online();
    server.query = new Query();
    server.query.host = input.query.host;
    server.query.port = input.query.port;

    server.delivery_mode = input.delivery_mode ?? DeliveryMode.Plugin;

    if (input.rcon) {
      server.rcon = new RCON();
      server.rcon.host = input.rcon.host;
      server.rcon.port = input.rcon.port;
      server.rcon.password = encryptField(input.rcon.password ?? '', ENCRYPTED_RCON_PASSWORD, server.id);
    }

    server.mods = await this.modsRepository.findBy({
      id: In(input.mods ?? []),
    });

    return this.serversRepository.save(server);
  }

  async update(id: string, input: ServerUpdateInput, request?: any): Promise<Server> {
    const server = await this.findOne(id, ['query', 'table', 'rcon', 'instances']);

    if (!server) {
      throw new NotFoundException();
    }

    await assertFieldAccess('server', input, server, request);

    server.name = input.name;
    server.version = input.version;
    server.slogan = input.slogan;
    server.description = input.description;
    server.content = input.content;
    server.wipe = input.wipe ?? false;
    server.table = (input.table ?? []).map((row, index) => ({ ...row, priority: index } as ServerTable));
    server.instances = (input.instances ?? []).map((instance, index) => ({ ...instance, priority: index } as ServerInstance));

    server.query.host = input.query.host;
    server.query.port = input.query.port;

    if (input.delivery_mode != null) {
      server.delivery_mode = input.delivery_mode;
    }

    if (input.rcon) {
      if (!server.rcon) {
        server.rcon = new RCON();
      }
      server.rcon.host = input.rcon.host;
      server.rcon.port = input.rcon.port;
      if (input.rcon.password) server.rcon.password = encryptField(input.rcon.password, ENCRYPTED_RCON_PASSWORD, server.id);
    }

    server.mods = await this.modsRepository.findBy({
      id: In(input.mods ?? []),
    });

    const saved = await this.serversRepository.save(server);
    this.rconService.invalidate(id);

    return saved;
  }

  gallery(id: string): Promise<ServerGalleryImage[]> {
    return this.galleryRepository.find({ where: { serverId: id }, order: { priority: 'ASC', id: 'ASC' } });
  }

  async addGalleryImage(id: string, input: GalleryImageInput, file: Express.Multer.File): Promise<ServerGalleryImage> {
    const server = await this.findOne(id);

    if (!server) {
      StorageManager.remove(file?.filename);
      throw new NotFoundException();
    }

    if ((await this.galleryRepository.countBy({ serverId: id })) >= SERVER_GALLERY_MAX_IMAGES) {
      StorageManager.remove(file?.filename);
      throw new BadRequestException();
    }

    if (!file) throw new BadRequestException();

    const image = new ServerGalleryImage();

    image.serverId = id;
    image.file = file.filename;
    image.title = input.title;
    image.priority = await this.galleryRepository.countBy({ serverId: id });

    return this.galleryRepository.save(image);
  }

  async sortGallery(id: string, input: NumberSortInput): Promise<ServerGalleryImage[]> {
    const images = await this.galleryRepository.findBy({ serverId: id, id: In(input.items.map((item) => item.id)) });

    for (const image of images) {
      image.priority = input.items.find((item) => item.id == image.id).priority;
    }

    await this.galleryRepository.save(images);

    return this.gallery(id);
  }

  async removeGalleryImage(id: string, imageId: number): Promise<ServerGalleryImage> {
    const image = await this.galleryRepository.findOneBy({ serverId: id, id: imageId });

    if (!image) throw new NotFoundException();

    return this.galleryRepository.remove(image);
  }

  async remove(id: string) {
    const server = await this.findOne(id);

    if (!server) {
      throw new NotFoundException();
    }

    const removed = await this.serversRepository.remove(server);
    this.rconService.invalidate(id);

    return removed;
  }

  async updateMedia(id: string, type: ServerMedia, file: Express.Multer.File) {
    const server = await this.findOne(id);

    if (!server) {
      StorageManager.remove(file.filename);
      throw new NotFoundException();
    }

    StorageManager.remove(server[type]);
    server[type] = file.filename;

    return this.serversRepository.save(server);
  }

  async removeMedia(id: string, type: ServerMedia) {
    const server = await this.findOne(id);

    if (!server) {
      throw new NotFoundException();
    }

    StorageManager.remove(server[type]);
    server[type] = null;

    return this.serversRepository.save(server);
  }
}

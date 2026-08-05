import { ForbiddenException, Injectable, NotFoundException, StreamableFile, UnsupportedMediaTypeException } from '@nestjs/common';
import { matchPermission } from 'src/admin/roles/guards/permisson.guard';
import { Permission } from 'unicore-common';
import { imageSize } from 'image-size';
import { StorageManager, STORAGE_MAX_IMAGE_UPLOAD } from '@common';
import { Repository } from 'typeorm';
import { Skin } from './entities/skin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Cloak } from './entities/cloak.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import MinecraftSkinType from '@unicorecms/minecraft-skin-type';

@Injectable()
export class SkinService {
  constructor(
    @InjectRepository(Skin)
    private skinsRepository: Repository<Skin>,
    @InjectRepository(Cloak)
    private cloaksRepository: Repository<Cloak>,
    private usersService: UsersService,
  ) {}

  private isPng(buffer: Buffer): boolean {
    return buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }

  private validateImage(file: Express.Multer.File): { width: number; height: number } {
    const buffer = StorageManager.read(file.filename, STORAGE_MAX_IMAGE_UPLOAD);

    if (!buffer || !this.isPng(buffer)) {
      StorageManager.remove(file.filename);
      throw new UnsupportedMediaTypeException();
    }

    const { width, height, type } = imageSize(buffer);

    if (type !== 'png' || !width || !height || width > 2048 || height > 2048) {
      StorageManager.remove(file.filename);
      throw new UnsupportedMediaTypeException();
    }

    return { width, height };
  }

  async updateSkin(user: User, file: Express.Multer.File) {
    let skin = (await this.skinsRepository.findOneBy({ user: { uuid: user.uuid } })) || new Skin();

    if (skin.file) StorageManager.remove(skin.file);

    skin.user = user;
    skin.file = file.filename;
    skin.slim = MinecraftSkinType.isSlim(StorageManager.path(file.filename));

    return this.skinsRepository.save(skin);
  }

  async updateSkinMe(req: any, file: Express.Multer.File) {
    const { width, height } = this.validateImage(file);

    if ((width > 64 || height > 64) && !(await matchPermission([Permission.UserCabinetSkinHd], req))) {
      StorageManager.remove(file.filename);
      throw new ForbiddenException();
    }

    return this.updateSkin(req.user, file);
  }

  async updateSkinByUUID(uuid: string, file: Express.Multer.File) {
    const user = await this.usersService.getById(uuid);
    if (!user) throw new NotFoundException();

    this.validateImage(file);

    return this.updateSkin(user, file);
  }

  async updateCloak(user: User, file: Express.Multer.File) {
    let cloak = (await this.cloaksRepository.findOneBy({ user: { uuid: user.uuid } })) || new Cloak();

    if (cloak.file) StorageManager.remove(cloak.file);

    cloak.user = user;
    cloak.file = file.filename;

    return this.cloaksRepository.save(cloak);
  }

  async updateCloakMe(req: any, file: Express.Multer.File) {
    const { width, height } = this.validateImage(file);

    if ((width > 64 || height > 64) && !(await matchPermission([Permission.UserCabinetCloakHd], req))) {
      StorageManager.remove(file.filename);
      throw new ForbiddenException();
    }

    return this.updateCloak(req.user, file);
  }

  async updateCloakByUUID(uuid: string, file: Express.Multer.File) {
    const user = await this.usersService.getById(uuid);
    if (!user) throw new NotFoundException();

    this.validateImage(file);

    return this.updateCloak(user, file);
  }

  async removeCloak(user: User) {
    if (!user.cloak) return;

    let cloak = await this.cloaksRepository.findOneBy({ user: { uuid: user.uuid } });
    cloak.user = user;

    if (cloak) this.cloaksRepository.remove(cloak);
  }

  async removeCloakByUUID(uuid: string) {
    const user = await this.usersService.getById(uuid);
    if (!user) throw new NotFoundException();

    return this.removeCloak(user);
  }

  async removeSkin(user: User) {
    if (!user.skin) return;

    let skin = await this.skinsRepository.findOneBy({ user: { uuid: user.uuid } });
    skin.user = user;

    if (skin) this.skinsRepository.remove(skin);
  }

  async removeSkinByUUID(uuid: string) {
    const user = await this.usersService.getById(uuid);
    if (!user) throw new NotFoundException();

    return this.removeSkin(user);
  }

  async streamSkinByUsername(username: string): Promise<StreamableFile> {
    const user = await this.usersService.getByUsername(username);
    if (user?.skin) var file = StorageManager.readStream(user.skin.file);

    if (!file) var default_file = StorageManager.readStream('default_skin.png');

    if (!file && !default_file) throw new NotFoundException();

    return new StreamableFile(file || default_file);
  }

  async streamSkinByUUID(uuid: string): Promise<StreamableFile> {
    const user = await this.usersService.getById(uuid);
    if (user?.skin) var file = StorageManager.readStream(user.skin.file);

    if (!file) var default_file = StorageManager.readStream('default_skin.png');

    if (!file && !default_file) throw new NotFoundException();

    return new StreamableFile(file || default_file);
  }

  async streamCloakByUsername(username: string): Promise<StreamableFile> {
    const user = await this.usersService.getByUsername(username);
    if (user?.cloak) var file = StorageManager.readStream(user.cloak.file);

    if (!file) var default_file = StorageManager.readStream('default_cloak.png');

    if (!file && !default_file) throw new NotFoundException();

    return new StreamableFile(file || default_file);
  }

  async streamCloakByUUID(uuid: string): Promise<StreamableFile> {
    const user = await this.usersService.getById(uuid);
    if (user?.cloak) var file = StorageManager.readStream(user.cloak.file);

    if (!file) var default_file = StorageManager.readStream('default_cloak.png');

    if (!file && !default_file) throw new NotFoundException();

    return new StreamableFile(file || default_file);
  }
}

import { ForbiddenException, Injectable, NotFoundException, StreamableFile, UnsupportedMediaTypeException } from '@nestjs/common';
import { matchPermission } from 'src/admin/roles/guards/permisson.guard';
import { imageSize } from 'image-size';
import { assertUploadedFile, DEFAULT_CLOAK_FILE, DEFAULT_SKIN_FILE, SKIN_MAX_SIZE, STORAGE_MAX_IMAGE_UPLOAD, StorageManager } from '@common';
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
    let valid = false;

    try {
      const buffer = StorageManager.read(file.filename, STORAGE_MAX_IMAGE_UPLOAD);

      if (!buffer || !this.isPng(buffer)) throw new UnsupportedMediaTypeException();

      const { width, height, type } = imageSize(buffer);

      if (type !== 'png' || !width || !height || width > SKIN_MAX_SIZE || height > SKIN_MAX_SIZE)
        throw new UnsupportedMediaTypeException();

      valid = true;

      return { width, height };
    } catch (e) {
      throw e instanceof UnsupportedMediaTypeException ? e : new UnsupportedMediaTypeException();
    } finally {
      if (!valid) StorageManager.remove(file.filename);
    }
  }

  async updateSkin(user: User, file: Express.Multer.File) {
    assertUploadedFile(file);

    let skin = (await this.skinsRepository.findOneBy({ user: { uuid: user.uuid } })) || new Skin();

    if (skin.file) StorageManager.remove(skin.file);

    skin.user = user;
    skin.file = file.filename;
    skin.slim = MinecraftSkinType.isSlim(StorageManager.path(file.filename));

    return this.skinsRepository.save(skin);
  }

  async updateSkinMe(req: any, file: Express.Multer.File) {
    const { width, height } = this.validateImage(file);

    if ((width > 64 || height > 64) && !(await matchPermission(['player.skin.hd'], req))) {
      StorageManager.remove(file.filename);
      throw new ForbiddenException('Скин в HD доступен по привилегии, обычный — 64×64 или 64×32');
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
    assertUploadedFile(file);

    let cloak = (await this.cloaksRepository.findOneBy({ user: { uuid: user.uuid } })) || new Cloak();

    if (cloak.file) StorageManager.remove(cloak.file);

    cloak.user = user;
    cloak.file = file.filename;

    return this.cloaksRepository.save(cloak);
  }

  async updateCloakMe(req: any, file: Express.Multer.File) {
    const { width, height } = this.validateImage(file);

    if ((width > 64 || height > 64) && !(await matchPermission(['player.cloak.hd'], req))) {
      StorageManager.remove(file.filename);
      throw new ForbiddenException('Плащ в HD доступен по привилегии, обычный — 64×32');
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
    const cloak = await this.cloaksRepository.findOneBy({ user: { uuid: user.uuid } });

    if (!cloak) return;

    if (cloak.file) StorageManager.remove(cloak.file);

    await this.cloaksRepository.remove(cloak);
  }

  async removeCloakByUUID(uuid: string) {
    const user = await this.usersService.getById(uuid);
    if (!user) throw new NotFoundException();

    return this.removeCloak(user);
  }

  async removeSkin(user: User) {
    const skin = await this.skinsRepository.findOneBy({ user: { uuid: user.uuid } });

    if (!skin) return;

    if (skin.file) StorageManager.remove(skin.file);

    await this.skinsRepository.remove(skin);
  }

  async removeSkinByUUID(uuid: string) {
    const user = await this.usersService.getById(uuid);
    if (!user) throw new NotFoundException();

    return this.removeSkin(user);
  }

  async streamSkinByUsername(username: string): Promise<StreamableFile> {
    const user = await this.usersService.getByUsername(username);
    if (user?.skin) var file = StorageManager.readStream(user.skin.file);

    if (!file) var default_file = StorageManager.readStream(DEFAULT_SKIN_FILE);

    if (!file && !default_file) throw new NotFoundException();

    return new StreamableFile(file || default_file);
  }

  async streamSkinByUUID(uuid: string): Promise<StreamableFile> {
    const user = await this.usersService.getById(uuid);
    if (user?.skin) var file = StorageManager.readStream(user.skin.file);

    if (!file) var default_file = StorageManager.readStream(DEFAULT_SKIN_FILE);

    if (!file && !default_file) throw new NotFoundException();

    return new StreamableFile(file || default_file);
  }

  async streamCloakByUsername(username: string): Promise<StreamableFile> {
    const user = await this.usersService.getByUsername(username);
    if (user?.cloak) var file = StorageManager.readStream(user.cloak.file);

    if (!file) var default_file = StorageManager.readStream(DEFAULT_CLOAK_FILE);

    if (!file && !default_file) throw new NotFoundException();

    return new StreamableFile(file || default_file);
  }

  async streamCloakByUUID(uuid: string): Promise<StreamableFile> {
    const user = await this.usersService.getById(uuid);
    if (user?.cloak) var file = StorageManager.readStream(user.cloak.file);

    if (!file) var default_file = StorageManager.readStream(DEFAULT_CLOAK_FILE);

    if (!file && !default_file) throw new NotFoundException();

    return new StreamableFile(file || default_file);
  }
}

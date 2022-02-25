import { ForbiddenException, Injectable, UnsupportedMediaTypeException } from '@nestjs/common';
import { MulterFile } from 'fastify-file-interceptor';
import { matchPermission } from 'src/admin/roles/guards/permisson.guard';
import { Permission } from 'unicore-common';
import sizeOf from 'image-size'
import { StorageManager } from '@common';
import { Repository } from 'typeorm';
import { Skin } from './entities/skin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Cloak } from './entities/cloak.entity';
import { User } from 'src/admin/users/entities/user.entity';

@Injectable()
export class SkinService {
  constructor(
    @InjectRepository(Skin)
    private skinsRepository: Repository<Skin>,
    @InjectRepository(Cloak)
    private cloaksRepository: Repository<Cloak>
  ) { }

  async updateSkinMe(req: any, file: MulterFile) {
    const { width, height } = sizeOf(StorageManager.read(file.filename))

    if (width > 2048 || height > 2048) {
      StorageManager.remove(file.filename)
      throw new UnsupportedMediaTypeException()
    }


    if ((width > 64 || height > 64) && !matchPermission([Permission.UserCabinetSkinHd], req)) {
      StorageManager.remove(file.filename)
      throw new ForbiddenException()
    }

    let skin = await this.skinsRepository.findOne(req.user.uuid) || new Skin()

    if (skin.file) StorageManager.remove(skin.file)

    skin.user = req.user
    skin.file = file.filename

    return this.skinsRepository.save(skin)
  }

  async updateCloakMe(req: any, file: MulterFile) {
    const { width, height } = sizeOf(StorageManager.read(file.filename))

    if (width > 2048 || height > 2048) {
      StorageManager.remove(file.filename)
      throw new UnsupportedMediaTypeException()
    }


    if ((width > 64 || height > 64) && !matchPermission([Permission.UserCabinetCloakHd], req)) {
      StorageManager.remove(file.filename)
      throw new ForbiddenException()
    }

    let cloak = await this.cloaksRepository.findOne(req.user.uuid) || new Cloak()

    if (cloak.file) StorageManager.remove(cloak.file)

    cloak.user = req.user
    cloak.file = file.filename

    return this.cloaksRepository.save(cloak)
  }

  async removeCloak(user: User) {
    if (!user.cloak) return

    let cloak = await this.cloaksRepository.findOne(user.uuid)
    cloak.user = user

    if (cloak)
      this.cloaksRepository.remove(cloak)
  }

  async removeSkin(user: User) {
    if (!user.skin) return

    let skin = await this.skinsRepository.findOne(user.uuid)
    skin.user = user

    if (skin)
      this.skinsRepository.remove(skin)
  }
}

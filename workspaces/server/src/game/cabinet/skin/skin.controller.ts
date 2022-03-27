import { StorageManager } from '@common';
import { Controller, Delete, Param, Patch, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileFastifyInterceptor, MulterFile } from 'fastify-file-interceptor';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permission } from 'unicore-common';
import { skinFileFilter } from './filters/skin.filter';
import { SkinService } from './skin.service';

@Controller('cabinet/skin')
export class SkinController {
  constructor(private skinsService: SkinService) {}

  @Permissions([Permission.UserCabinetSkin])
  @Patch('skin')
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: skinFileFilter,
    }),
  )
  updateSkinMe(@Req() req: any, @UploadedFile() file: MulterFile) {
    return this.skinsService.updateSkinMe(req, file);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsUpdate])
  @Patch('skin/:uuid')
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: skinFileFilter,
    }),
  )
  updateSkin(@Param('uuid') uuid: string, @UploadedFile() file: MulterFile) {
    return this.skinsService.updateSkinByUUID(uuid, file);
  }

  @Permissions([Permission.UserCabinetCloak])
  @Patch('cloak')
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: skinFileFilter,
    }),
  )
  updateCloakMe(@Req() req: any, @UploadedFile() file: MulterFile) {
    return this.skinsService.updateCloakMe(req, file);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsUpdate])
  @Patch('cloak/:uuid')
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: skinFileFilter,
    }),
  )
  updateCloak(@Param('uuid') uuid: string, @UploadedFile() file: MulterFile) {
    return this.skinsService.updateCloakByUUID(uuid, file);
  }

  @Permissions([Permission.UserCabinetSkin])
  @Delete('skin')
  removeSkinMe(@CurrentUser() user: User) {
    return this.skinsService.removeSkin(user);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsUpdate])
  @Delete('skin/:uuid')
  removeSkin(@Param('uuid') uuid: string) {
    return this.skinsService.removeSkinByUUID(uuid);
  }

  @Permissions([Permission.UserCabinetCloak])
  @Delete('cloak')
  removeCloakMe(@CurrentUser() user: User) {
    return this.skinsService.removeCloak(user);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsUpdate])
  @Delete('cloak/:uuid')
  removeCloak(@Param('uuid') uuid: string) {
    return this.skinsService.removeCloakByUUID(uuid);
  }
}

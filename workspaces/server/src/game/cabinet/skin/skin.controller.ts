import { StorageManager, STORAGE_MAX_IMAGE_UPLOAD } from '@common';
import { Controller, Delete, Get, Param, Patch, Req, Response, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { Permission } from 'unicore-common';
import { skinFileFilter } from './filters/skin.filter';
import { SkinService } from './skin.service';

@Controller('cabinet/skin')
export class SkinController {
  constructor(private skinsService: SkinService) {}

  @Public()
  @Get('public/skin/username/:username')
  async streamSkinByUsername(@Response({ passthrough: true }) res, @Param('username') username: string) {
    const file = await this.skinsService.streamSkinByUsername(username);
    res.headers({ 'Content-Type': 'image/png' });
    return file;
  }

  @Public()
  @Get('public/skin/uuid/:uuid')
  async streamSkinByUUID(@Response({ passthrough: true }) res, @Param('uuid') uuid: string) {
    const file = await this.skinsService.streamSkinByUUID(uuid);
    res.headers({ 'Content-Type': 'image/png' });
    return file;
  }

  @Public()
  @Get('public/cloak/username/:username')
  async streamCloakByUsername(@Response({ passthrough: true }) res, @Param('username') username: string) {
    const file = await this.skinsService.streamCloakByUsername(username);
    res.headers({ 'Content-Type': 'image/png' });
    return file;
  }

  @Public()
  @Get('public/cloak/uuid/:uuid')
  async streamCloakByUUID(@Response({ passthrough: true }) res, @Param('uuid') uuid: string) {
    const file = await this.skinsService.streamCloakByUUID(uuid);
    res.headers({ 'Content-Type': 'image/png' });
    return file;
  }

  @Permissions([Permission.UserCabinetSkin])
  @Patch('skin')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: skinFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD },
    }),
  )
  updateSkinMe(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.skinsService.updateSkinMe(req, file);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsUpdate])
  @Patch('skin/:uuid')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: skinFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD },
    }),
  )
  updateSkin(@Param('uuid') uuid: string, @UploadedFile() file: Express.Multer.File) {
    return this.skinsService.updateSkinByUUID(uuid, file);
  }

  @Permissions([Permission.UserCabinetCloak])
  @Patch('cloak')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: skinFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD },
    }),
  )
  updateCloakMe(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.skinsService.updateCloakMe(req, file);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsUpdate])
  @Patch('cloak/:uuid')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: skinFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD },
    }),
  )
  updateCloak(@Param('uuid') uuid: string, @UploadedFile() file: Express.Multer.File) {
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

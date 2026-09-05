import { STORAGE_MAX_IMAGE_UPLOAD, StorageManager, TEXTURE_CACHE_CONTROL } from '@common';
import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Req,
  Response,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response as ExpressResponse } from 'express';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { skinFileFilter } from './filters/skin.filter';
import { SkinService } from './skin.service';

@Controller('cabinet/skin')
export class SkinController {
  constructor(private skinsService: SkinService) {}

  private texture(req: Request, res: ExpressResponse, file: string): StreamableFile | undefined {
    const etag = `"${file}"`;

    res.set({ 'Content-Type': 'image/png', 'Cache-Control': TEXTURE_CACHE_CONTROL, ETag: etag });

    if (req.headers['if-none-match'] === etag) {
      res.status(HttpStatus.NOT_MODIFIED);
      return;
    }

    const stream = StorageManager.readStream(file);

    if (!stream) throw new NotFoundException();

    return new StreamableFile(stream);
  }

  @Public()
  @Get('public/skin/username/:username')
  async streamSkinByUsername(
    @Req() req: Request,
    @Response({ passthrough: true }) res: ExpressResponse,
    @Param('username') username: string,
  ) {
    return this.texture(req, res, await this.skinsService.skinFileByUsername(username));
  }

  @Public()
  @Get('public/skin/uuid/:uuid')
  async streamSkinByUUID(@Req() req: Request, @Response({ passthrough: true }) res: ExpressResponse, @Param('uuid') uuid: string) {
    return this.texture(req, res, await this.skinsService.skinFileByUUID(uuid));
  }

  @Public()
  @Get('public/cloak/username/:username')
  async streamCloakByUsername(
    @Req() req: Request,
    @Response({ passthrough: true }) res: ExpressResponse,
    @Param('username') username: string,
  ) {
    return this.texture(req, res, await this.skinsService.cloakFileByUsername(username));
  }

  @Public()
  @Get('public/cloak/uuid/:uuid')
  async streamCloakByUUID(@Req() req: Request, @Response({ passthrough: true }) res: ExpressResponse, @Param('uuid') uuid: string) {
    return this.texture(req, res, await this.skinsService.cloakFileByUUID(uuid));
  }

  @Permissions(['player.skin.upload'])
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

  @Permissions(['panel.access', 'panel.users.skin'])
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

  @Permissions(['player.cloak.upload'])
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

  @Permissions(['panel.access', 'panel.users.cloak'])
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

  @Permissions(['player.skin.upload'])
  @Delete('skin')
  removeSkinMe(@CurrentUser() user: User) {
    return this.skinsService.removeSkin(user);
  }

  @Permissions(['panel.access', 'panel.users.skin'])
  @Delete('skin/:uuid')
  removeSkin(@Param('uuid') uuid: string) {
    return this.skinsService.removeSkinByUUID(uuid);
  }

  @Permissions(['player.cloak.upload'])
  @Delete('cloak')
  removeCloakMe(@CurrentUser() user: User) {
    return this.skinsService.removeCloak(user);
  }

  @Permissions(['panel.access', 'panel.users.cloak'])
  @Delete('cloak/:uuid')
  removeCloak(@Param('uuid') uuid: string) {
    return this.skinsService.removeCloakByUUID(uuid);
  }
}

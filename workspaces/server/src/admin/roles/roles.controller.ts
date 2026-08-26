import { Body, Controller, Get, Post, Patch, Param, Delete, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileFilter, STORAGE_MAX_IMAGE_UPLOAD, StorageManager } from '@common';
import { Permissions } from './decorators/permission.decorator';
import { matchPermission } from './guards/permisson.guard';
import { RoleCreateInput } from './dto/role-create.input';
import { RoleUpdateInput } from './dto/role-update.input';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';

@Controller('admin/roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Permissions(['panel.access'])
  @Get()
  async findAll(@Req() request: any): Promise<Role[]> {
    const roles = await this.rolesService.find();

    if (await matchPermission(['panel.roles.read'], request)) return roles;

    return roles.map((role) => ({ ...role, perms: [] })) as Role[];
  }

  @Permissions(['panel.roles.create'])
  @Post()
  create(@Req() request: any, @Body() body: RoleCreateInput) {
    return this.rolesService.create(body, request);
  }

  @Permissions(['panel.roles.update'])
  @Patch(':id')
  update(@Req() request: any, @Param('id') id: string, @Body() body: RoleUpdateInput) {
    return this.rolesService.update(id, body, request);
  }

  @Permissions(['panel.roles.delete'])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Permissions(['panel.roles.update'])
  @Patch(':id/badge')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD, files: 1 },
    }),
  )
  updateBadgeImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.rolesService.updateBadgeImage(id, file);
  }

  @Permissions(['panel.roles.update'])
  @Delete(':id/badge')
  removeBadgeImage(@Param('id') id: string) {
    return this.rolesService.removeBadgeImage(id);
  }
}

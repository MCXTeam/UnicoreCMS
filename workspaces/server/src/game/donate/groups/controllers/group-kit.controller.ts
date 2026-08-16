import { NumberSortInput, DeleteManyInput, imageFileFilter, StorageManager } from '@common';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { Permission } from 'unicore-common';
import { GroupKitInput } from '../dto/group-kit.input';
import { GroupKitsService } from '../providers/group-kit.service';

@Controller('donates/group-kits')
export class GroupKitsController {
  constructor(private groupKitsService: GroupKitsService) {}

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateKitsCreate])
  @Post()
  create(@Body() body: GroupKitInput) {
    return this.groupKitsService.create(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateKitsUpdate])
  @Post('sort')
  sort(@Body() body: NumberSortInput) {
    return this.groupKitsService.sort(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateRead])
  @Get()
  find() {
    return this.groupKitsService.find();
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateKitsDeleteMany])
  @Delete('bulk')
  removeMany(@Body() body: DeleteManyInput) {
    return this.groupKitsService.removeMany(body.items);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateRead])
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const server = await this.groupKitsService.findOne(id);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateKitsUpdate])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: GroupKitInput) {
    return this.groupKitsService.update(id, body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateKitsDelete])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupKitsService.remove(id);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateKitsUpdate])
  @Patch('image/:server/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
    }),
  )
  updateMedia(@Param('server') server: string, @Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.groupKitsService.updateMedia(server, id, file);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateKitsUpdate])
  @Delete('image/:server/:id')
  removeMedia(@Param('server') server: string, @Param('id', ParseIntPipe) id: number) {
    return this.groupKitsService.removeMedia(server, id);
  }
}

import { DeleteManyInput, imageFileFilter, IpAddress, StorageManager } from '@common';
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
import { FileFastifyInterceptor, MulterFile } from 'fastify-file-interceptor';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permission } from 'unicore-common';
import { GroupBuyInput } from '../dto/group-buy.input';
import { GroupInput } from '../dto/group.input';
import { DonateGroupsService } from '../providers/groups.service';

@Controller('donates/groups')
export class DonateGroupsController {
  constructor(private donateGroupsService: DonateGroupsService) { }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsCreate])
  @Post()
  create(@Body() body: GroupInput) {
    return this.donateGroupsService.create(body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateRead])
  @Get()
  find() {
    return this.donateGroupsService.find(['servers']);
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return this.donateGroupsService.me(user);
  }

  @Get('server/:id')
  async findByServer(@Param('id') id: string) {
    return this.donateGroupsService.findByServer(id);
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Get("user/:server/:uuid")
  async findOneByUserAndServer(@Param('server') server: string, @Param('uuid') uuid: string) {
    return this.donateGroupsService.findByUserAndServer(server, uuid)
  }

  @Post('buy')
  async buy(@CurrentUser() user: User, @IpAddress() ip: string, @Body() body: GroupBuyInput) {
    return this.donateGroupsService.buy(user, ip, body)
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateRead])
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const server = await this.donateGroupsService.findOne(id, ['periods', 'servers', 'kits']);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsUpdate])
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: GroupInput) {
    return this.donateGroupsService.update(id, body);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsDelete])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.donateGroupsService.remove(id);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsDeleteMany])
  @Delete('bulk/:ids')
  removeMany(@Body() body: DeleteManyInput) {
    return this.donateGroupsService.removeMany(body.items);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsUpdate])
  @Patch('icon/:id')
  @UseInterceptors(
    FileFastifyInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: MulterFile) {
    return this.donateGroupsService.updateIcon(id, file);
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsUpdate])
  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.donateGroupsService.removeIcon(id);
  }
}

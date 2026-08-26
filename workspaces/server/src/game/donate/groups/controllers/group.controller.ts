import { DeleteManyInput, imageFileFilter, IpAddress, NumberSortInput, STORAGE_MAX_IMAGE_UPLOAD, StorageManager } from '@common';
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
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { assertServerPermission } from 'src/admin/roles/guards/permisson.guard';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { GiveDonateGroupInput } from '../dto/give-donate-group.input';
import { GroupBuyInput } from '../dto/group-buy.input';
import { GroupInput } from '../dto/group.input';
import { DonateGroupsService } from '../providers/groups.service';

@Controller('donates/groups')
export class DonateGroupsController {
  constructor(private donateGroupsService: DonateGroupsService) {}

  @Permissions(['panel.access', 'panel.donate.groups.create'])
  @Post()
  create(@Req() request: any, @Body() body: GroupInput) {
    return this.donateGroupsService.create(body, request);
  }

  @Permissions(['panel.access', 'panel.donate.groups.update'])
  @Post('sort')
  sort(@Body() body: NumberSortInput) {
    return this.donateGroupsService.sort(body);
  }

  @Permissions([
    ['panel.donate.read', 'panel.users.donate', 'panel.users.donate.*'],
    { or: true },
  ])
  @Get()
  find() {
    return this.donateGroupsService.find(['servers', 'kits', 'periods', 'features']);
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return this.donateGroupsService.me(user);
  }

  @Permissions(['panel.access', 'panel.donate.groups.delete.many'])
  @Delete('bulk')
  removeMany(@Body() body: DeleteManyInput) {
    return this.donateGroupsService.removeMany(body.items);
  }

  @Public()
  @Get('server/:id')
  async findByServer(@Param('id') id: string) {
    return this.donateGroupsService.findByServer(id);
  }

  @Permissions(['kernel.connect'])
  @Get('user/:server/:uuid')
  findOneByUserAndServer(@Param('server') server: string, @Param('uuid') uuid: string) {
    return this.donateGroupsService.findByUserAndServer(server, uuid);
  }

  @Permissions(['player.donate.group.buy'])
  @Post('buy')
  buy(@CurrentUser() user: User, @IpAddress() ip: string, @Body() body: GroupBuyInput) {
    return this.donateGroupsService.buy(user, ip, body);
  }

  @Permissions([
    ['panel.donate.read', 'panel.users.donate', 'panel.users.donate.*'],
    { or: true },
  ])
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const server = await this.donateGroupsService.findOne(id, ['periods', 'servers', 'kits']);

    if (!server) {
      throw new NotFoundException();
    }

    return server;
  }

  @Permissions(['panel.access', 'panel.donate.groups.update'])
  @Patch(':id')
  update(@Req() request: any, @Param('id', ParseIntPipe) id: number, @Body() body: GroupInput) {
    return this.donateGroupsService.update(id, body, request);
  }

  @Permissions(['panel.access', 'panel.donate.groups.delete'])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.donateGroupsService.remove(id);
  }

  @Permissions(['panel.access', 'panel.donate.groups.update'])
  @Patch('icon/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: StorageManager.disk(),
      fileFilter: imageFileFilter,
      limits: { fileSize: STORAGE_MAX_IMAGE_UPLOAD, files: 1 },
    }),
  )
  updateMedia(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.donateGroupsService.updateIcon(id, file);
  }

  @Permissions(['panel.access', 'panel.donate.groups.update'])
  @Delete('icon/:id')
  removeMedia(@Param('id', ParseIntPipe) id: number) {
    return this.donateGroupsService.removeIcon(id);
  }

  @Permissions(['panel.access', 'panel.users.read'])
  @Get('admin/:uuid')
  udgByUUID(@CurrentUser() user: User, @Param('uuid') uuid: string) {
    return this.donateGroupsService.udgByUUID(uuid);
  }

  @Permissions(['panel.access'])
  @Post('admin/give')
  async give(@Req() request: any, @Body() body: GiveDonateGroupInput) {
    await assertServerPermission(request, 'panel.users.donate', body.server_id);

    return this.donateGroupsService.giveByDTO(body);
  }

  @Permissions(['panel.access', 'panel.users.donate'])
  @Delete('admin/:id')
  take(@Param('id', ParseIntPipe) id: number) {
    return this.donateGroupsService.take(id);
  }
}

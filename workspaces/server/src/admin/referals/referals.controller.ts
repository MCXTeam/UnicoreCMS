import { Audit, Paginate, PaginateQuery } from '@common';
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { UserProtectedDto } from '../users/dto/user-protected.dto';
import { Permissions } from '../roles/decorators/permission.decorator';
import { AdminReferalDto, PaginatedReferalsDto } from './dto/admin-referal.dto';
import { ReferalInput, ReferalInviterInput } from './dto/referal.input';
import { AdminReferalsService } from './referals.service';

@Permissions(['panel.access'])
@Controller('admin')
export class AdminReferalsController {
  constructor(private adminReferalsService: AdminReferalsService) {}

  @Permissions(['panel.referals.read'])
  @Get('referals')
  async findAll(@Paginate() query: PaginateQuery): Promise<PaginatedReferalsDto> {
    return new PaginatedReferalsDto(await this.adminReferalsService.findAll(query));
  }

  @Permissions(['panel.referals.read'])
  @Get('referals/lookup')
  async lookup(@Query('search') search: string) {
    const users = await this.adminReferalsService.lookup(search);

    return users.map((user) => instanceToPlain(new UserProtectedDto(user)));
  }

  @Permissions(['panel.referals.create'])
  @Audit({ action: 'referal.create', target: 'referal' })
  @Post('referals')
  async create(@Body() body: ReferalInput) {
    return new AdminReferalDto(await this.adminReferalsService.create(body));
  }

  @Permissions(['panel.referals.update'])
  @Audit({ action: 'referal.update', target: 'referal', param: 'uuid' })
  @Patch('referals/:uuid')
  async update(@Param('uuid', ParseUUIDPipe) uuid: string, @Body() body: ReferalInviterInput) {
    return new AdminReferalDto(await this.adminReferalsService.update(uuid, body));
  }

  @Permissions(['panel.referals.delete'])
  @Audit({ action: 'referal.delete', target: 'referal', param: 'uuid' })
  @Delete('referals/:uuid')
  async remove(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return new AdminReferalDto(await this.adminReferalsService.remove(uuid));
  }
}

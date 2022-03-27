import { Controller, Get, Param } from '@nestjs/common';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permission } from 'unicore-common';
import { HistoryService } from './history.service';

@Controller('cabinet/history')
export class HistoryController {
  constructor (private histiryService: HistoryService) {}

  @Get('me')
  findOwn(@Paginate() query: PaginateQuery, @CurrentUser() user: User) {
    return this.histiryService.find(query, user)
  }

  @Permissions([Permission.AdminDashboard, Permission.EditorDonateGroupsUpdate])
  @Get('user/:uuid')
  find(@Paginate() query: PaginateQuery, @Param('uuid') uuid: string) {
    return this.histiryService.findByUUID(query, uuid)
  }
}

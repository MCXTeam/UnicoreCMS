import { Controller, Get } from '@nestjs/common';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { User } from 'src/admin/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { HistoryService } from './history.service';

@Controller('cabinet/history')
export class HistoryController {
  constructor (private histiryService: HistoryService) {}

  @Get('me')
  findOwn(@Paginate() query: PaginateQuery, @CurrentUser() user: User) {
    return this.histiryService.find(query, user)
  }
}

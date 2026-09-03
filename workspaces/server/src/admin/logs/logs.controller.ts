import { Controller, Get, Req } from '@nestjs/common';
import { Paginate, PaginateQuery } from '@common';
import { Permissions } from '../roles/decorators/permission.decorator';
import { LogsService } from './logs.service';

@Permissions(['panel.access', 'panel.logs.read'])
@Controller('admin/logs')
export class LogsController {
  constructor(private logsService: LogsService) {}

  @Get('actions')
  actions() {
    return this.logsService.actions();
  }

  @Get('classes')
  classes(@Req() request: any) {
    return this.logsService.allowedClasses(request);
  }

  @Get()
  find(@Req() request: any, @Paginate() query: PaginateQuery) {
    return this.logsService.find(query, request);
  }
}

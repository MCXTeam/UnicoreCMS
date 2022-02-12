import { Controller, Get } from '@nestjs/common';
import { Permissions } from '../roles/decorators/permission.decorator';
import { DashboardService } from './dashboard.service';
import { Permission } from 'unicore-common';

@Permissions([Permission.AdminDashboard])
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private dahboardService: DashboardService) {}

  @Get('stats')
  stats() {
    return this.dahboardService.stats();
  }
}

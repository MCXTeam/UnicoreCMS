import { Controller, Get, Query, Req } from '@nestjs/common';
import { Permissions } from '../roles/decorators/permission.decorator';
import { matchPermission } from '../roles/guards/permisson.guard';
import { DashboardService } from './dashboard.service';
import { RevenueQuery } from './dto/revenue.dto';
import { DashboardStatSection, DASHBOARD_STAT_PERMISSIONS, DASHBOARD_STAT_SECTIONS, Permission } from 'unicore-common';

@Permissions([Permission.AdminDashboard])
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private dahboardService: DashboardService) {}

  @Get('stats')
  async stats(@Req() request: any) {
    const allowed = await Promise.all(
      DASHBOARD_STAT_SECTIONS.map(async (section) =>
        (await matchPermission([DASHBOARD_STAT_PERMISSIONS[section]], request)) ? section : null,
      ),
    );

    return this.dahboardService.stats(allowed.filter(Boolean) as DashboardStatSection[]);
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminDashboardRevenue])
  @Get('revenue')
  async revenue(@Query() query: RevenueQuery) {
    return this.dahboardService.revenue(query);
  }
}

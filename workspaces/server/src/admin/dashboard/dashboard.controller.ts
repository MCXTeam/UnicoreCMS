import { Controller, Get, Query, Req } from '@nestjs/common';
import { Permissions } from '../roles/decorators/permission.decorator';
import { matchPermission } from '../roles/guards/permisson.guard';
import { allowedServers } from '../roles/server-scope';
import { DashboardService } from './dashboard.service';
import { RevenueQuery } from './dto/revenue.dto';
import { anyScope, DashboardStatSection, DASHBOARD_STAT_PERMISSIONS, DASHBOARD_STAT_SECTIONS } from 'unicore-common';

@Permissions(['panel.access'])
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private dahboardService: DashboardService) {}

  @Get('stats')
  async stats(@Req() request: any) {
    const allowed = await Promise.all(
      DASHBOARD_STAT_SECTIONS.map(async (section) =>
        (await matchPermission([anyScope(DASHBOARD_STAT_PERMISSIONS[section])], request)) ? section : null,
      ),
    );

    return this.dahboardService.stats(
      allowed.filter(Boolean) as DashboardStatSection[],
      await allowedServers(request, 'panel.dashboard.purchases'),
    );
  }

  @Permissions(['panel.access', 'panel.revenue.access', 'panel.revenue.read.*'])
  @Get('revenue')
  async revenue(@Req() request: any, @Query() query: RevenueQuery) {
    return this.dahboardService.revenue(query, await allowedServers(request, 'panel.revenue.read'));
  }

  @Permissions(['panel.access', 'panel.revenue.access', 'panel.revenue.items.*'])
  @Get('revenue/items')
  async revenueItems(@Req() request: any, @Query() query: RevenueQuery) {
    return this.dahboardService.revenueItems(query, await allowedServers(request, 'panel.revenue.items'));
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from 'src/admin/config/config.module';
import { AccountRestrictionsService } from './account-restrictions.service';
import { PunishmentAccess } from './punishment-access.service';
import { PunishmentAdmin } from './punishment-admin.service';
import { PunishmentCoordinator } from './punishment-coordinator.service';
import { PunishmentDeliveryService } from './punishment-delivery.service';
import { PunishmentGroupsService } from './punishment-groups.service';
import { PunishmentPolicy } from './punishment-policy.service';
import { PunishmentPurchasesService } from './punishment-purchases.service';
import { PunishmentTasks } from './punishment-tasks.service';
import { PunishmentViews } from './punishment-views.service';
import { PunishmentAdminController, PunishmentPlayerController, PunishmentPublicController } from './punishments.controller';

@Module({
  imports: [ConfigModule],
  providers: [AccountRestrictionsService, PunishmentAccess, PunishmentAdmin, PunishmentCoordinator, PunishmentDeliveryService, PunishmentGroupsService, PunishmentPolicy, PunishmentPurchasesService, PunishmentTasks, PunishmentViews],
  controllers: [PunishmentAdminController, PunishmentPlayerController, PunishmentPublicController],
  exports: [AccountRestrictionsService, PunishmentAccess, PunishmentAdmin, PunishmentCoordinator, PunishmentDeliveryService, PunishmentPurchasesService, PunishmentViews],
})
export class PunishmentsModule {}

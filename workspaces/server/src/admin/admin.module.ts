import { Module } from '@nestjs/common';
import { MigrationsModule } from './migrations/migrations.module';
import { RolesModule } from './roles/roles.module';
import { NewsModule } from './news/news.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LogModule } from './logs/logs.module';
import { ConfigModule } from './config/config.module';
import { WebhooksModule } from './webhook/webhooks.module';
import { ApiModule } from './api/api.module';
import { StorageModule } from './storage/storage.module';
import { LayoutModule } from './layout/layout.module';
import { PagesModule } from './pages/pages.module';
import { EmailModule } from './email/email.module';
import { LocalesModule } from './locales/locales.module';
import { AdminPaymentsModule } from './payments/payments.module';
import { AdminReferalsModule } from './referals/referals.module';

@Module({
  imports: [
    MigrationsModule,
    RolesModule,
    NewsModule,
    DashboardModule,
    LogModule,
    ConfigModule,
    WebhooksModule,
    ApiModule,
    StorageModule,
    PagesModule,
    LayoutModule,
    EmailModule,
    LocalesModule,
    AdminPaymentsModule,
    AdminReferalsModule,
  ],
})
export class AdminModule {}

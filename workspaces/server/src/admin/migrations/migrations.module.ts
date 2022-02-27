import { Module } from '@nestjs/common';
import { MigrationsService } from './migrations.service';
import { MigrationsController } from './migrations.controller';

@Module({
  providers: [MigrationsService],
  controllers: [MigrationsController],
})
export class MigrationsModule {}

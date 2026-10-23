import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HardwareBan, HardwareDevice, HardwareJoin, HardwareKey, HardwareRegistry, HardwareSession, HardwareUser } from './entities/hardware.entity';
import { HardwareService } from './hardware.service';
import { HardwareAdminService } from './hardware-admin.service';
import { HardwareAdminController } from './hardware.controller';
import { HardwareTasks } from './hardware.tasks';

@Module({
  imports: [TypeOrmModule.forFeature([HardwareDevice, HardwareKey, HardwareRegistry, HardwareSession, HardwareUser, HardwareBan, HardwareJoin])],
  providers: [HardwareService, HardwareAdminService, HardwareTasks],
  controllers: [HardwareAdminController],
  exports: [HardwareService],
})
export class HardwareModule {}

import { Module } from '@nestjs/common';
import { UpdatesService } from './updates.service';
import { UpdatesController } from './updates.controller';
import { UpdatesSetupService } from './updates-setup.service';

@Module({ providers: [UpdatesService, UpdatesSetupService], controllers: [UpdatesController] })
export class UpdatesModule {}

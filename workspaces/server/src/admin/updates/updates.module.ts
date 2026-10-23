import { Module } from '@nestjs/common';
import { UpdatesService } from './updates.service';
import { UpdatesController } from './updates.controller';

@Module({ providers: [UpdatesService], controllers: [UpdatesController] })
export class UpdatesModule {}

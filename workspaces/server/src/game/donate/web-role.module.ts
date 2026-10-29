import { Module } from '@nestjs/common';
import { DonateWebRoleService } from './web-role.service';

@Module({ providers: [DonateWebRoleService], exports: [DonateWebRoleService] })
export class DonateWebRoleModule {}

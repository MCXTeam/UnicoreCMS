import { IsOptional, IsUUID } from 'class-validator';
import { PickType } from '@nestjs/swagger';
import { GravitJoinServer } from './gravit-join-server.input';

export class GravitHardwareJoinInput extends PickType(GravitJoinServer, ['username', 'accessToken', 'serverId'] as const) {
  @IsOptional()
  @IsUUID()
  uuid?: string;

  @IsOptional()
  @IsUUID()
  hardwareId?: string;
}

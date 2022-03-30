import { IsDefined, IsOptional, IsString } from 'class-validator';

export class BanFromAdminInput {
  @IsDefined()
  @IsString()
  user_uuid: string;

  @IsOptional()
  @IsString()
  expires?: Date;

  @IsDefined()
  @IsString()
  reason: string;
}

import { IsDefined, IsNumber, IsOptional, IsString } from 'class-validator';

export class BanFromAdminInput {
  @IsDefined()
  @IsString()
  user_uuid: string;

  @IsOptional()
  @IsNumber()
  expires?: Date;

  @IsDefined()
  @IsString()
  reason: string;
}

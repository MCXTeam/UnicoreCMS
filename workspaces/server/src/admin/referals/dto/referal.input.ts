import { IsDefined, IsString, IsUUID } from 'class-validator';

export class ReferalInput {
  @IsDefined()
  @IsString()
  @IsUUID()
  user_uuid: string;

  @IsDefined()
  @IsString()
  @IsUUID()
  inviter_uuid: string;
}

export class ReferalInviterInput {
  @IsDefined()
  @IsString()
  @IsUUID()
  inviter_uuid: string;
}

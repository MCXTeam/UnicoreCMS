import { SERVER_ID_MAX_LENGTH } from '@common';
import { IsDefined, IsInt, IsString, IsUUID, MaxLength } from 'class-validator';

export class GiveKitInput {
  @IsDefined()
  @IsString()
  @MaxLength(SERVER_ID_MAX_LENGTH)
  server_id: string;

  @IsDefined()
  @IsInt()
  kit_id: number;

  @IsDefined()
  @IsUUID()
  user_uuid: string;
}

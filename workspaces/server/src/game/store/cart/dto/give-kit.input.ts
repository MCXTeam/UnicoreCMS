import { IsDefined, IsInt, IsString } from 'class-validator';

export class GiveKitInput {
  @IsDefined()
  @IsString()
  server_id: string;

  @IsDefined()
  @IsInt()
  kit_id: string;

  @IsDefined()
  @IsString()
  user_uuid: string;
}

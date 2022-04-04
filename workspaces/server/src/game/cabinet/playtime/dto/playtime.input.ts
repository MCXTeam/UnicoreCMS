import { IsDefined, IsString } from 'class-validator';

export class PlaytimeInput {
  @IsDefined()
  @IsString()
  user_uuid: string;

  @IsDefined()
  @IsString()
  server: string;
}

import { IsDefined, IsString } from 'class-validator';

export class RefreshTokenInput {
  @IsDefined()
  @IsString()
  refresh_token: string;
}

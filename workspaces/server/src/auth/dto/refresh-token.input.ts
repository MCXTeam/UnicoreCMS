import { IsOptional, IsString, MaxLength } from 'class-validator';
import { TOKEN_MAX_LENGTH } from '@common';

export class RefreshTokenInput {
  @IsOptional()
  @IsString()
  @MaxLength(TOKEN_MAX_LENGTH)
  refresh_token?: string;
}

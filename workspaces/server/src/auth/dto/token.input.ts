import { IsOptional, IsString, MaxLength } from 'class-validator';
import { TOKEN_MAX_LENGTH } from '@common';

export class TokenInput {
  @IsOptional()
  @IsString()
  @MaxLength(TOKEN_MAX_LENGTH)
  token?: string;
}

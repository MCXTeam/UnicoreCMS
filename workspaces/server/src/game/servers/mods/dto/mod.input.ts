import { IsDefined, IsOptional, IsString } from 'class-validator';
import { SanitizeHtml } from '@common';

export class ModInput {
  @IsDefined()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  link: string;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  description: string;
}

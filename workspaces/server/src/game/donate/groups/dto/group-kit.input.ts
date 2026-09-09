import { IsDefined, IsOptional, IsString } from 'class-validator';
import { SanitizeHtml } from '@common';

export class GroupKitInput {
  @IsDefined()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  description: string;
}

export class GroupKitDescriptionInput {
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  description?: string;
}

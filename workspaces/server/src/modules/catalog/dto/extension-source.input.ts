import { IsBoolean, IsDefined, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  EXTENSION_KINDS,
  EXTENSION_SOURCE_LOCATION_MAX_LENGTH,
  EXTENSION_SOURCE_NAME_MAX_LENGTH,
  EXTENSION_SOURCE_TYPES,
  ExtensionKind,
  ExtensionSourceType,
} from 'unicore-common';
import { TOKEN_MAX_LENGTH } from '@common';

export class ExtensionSourceInput {
  @IsDefined()
  @IsString()
  @MaxLength(EXTENSION_SOURCE_NAME_MAX_LENGTH)
  name: string;

  @IsDefined()
  @IsIn(EXTENSION_KINDS)
  kind: ExtensionKind;

  @IsDefined()
  @IsIn(EXTENSION_SOURCE_TYPES)
  type: ExtensionSourceType;

  @IsDefined()
  @IsString()
  @MaxLength(EXTENSION_SOURCE_LOCATION_MAX_LENGTH)
  location: string;

  @IsOptional()
  @IsString()
  @MaxLength(TOKEN_MAX_LENGTH)
  token?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

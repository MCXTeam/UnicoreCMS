import { IsDefined, IsIn, IsInt, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';
import { EXTENSION_KINDS, ExtensionKind } from 'unicore-common';
import { MODULE_ID_PATTERN } from 'unicore-api';
import { TOKEN_MAX_LENGTH } from '@common';

export class CatalogInstallInput {
  @IsDefined()
  @IsIn(EXTENSION_KINDS)
  kind: ExtensionKind;

  @IsDefined()
  @Matches(MODULE_ID_PATTERN)
  id: string;

  @IsDefined()
  @IsInt()
  sourceId: number;
}

export class InstallUrlInput {
  @IsDefined()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(TOKEN_MAX_LENGTH)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(TOKEN_MAX_LENGTH)
  token?: string;
}

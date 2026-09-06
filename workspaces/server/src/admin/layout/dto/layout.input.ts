import { IsArray, IsDefined, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { LAYOUT_MODES, LayoutMode, LayoutRow } from 'unicore-common';
import { LAYOUT_HTML_MAX_LENGTH } from '@common';

export class LayoutInput {
  @IsDefined()
  @IsIn(LAYOUT_MODES as unknown as string[])
  mode: LayoutMode;

  @IsDefined()
  @IsArray()
  rows: LayoutRow[];

  @IsOptional()
  @IsString()
  @MaxLength(LAYOUT_HTML_MAX_LENGTH)
  html?: string;
}

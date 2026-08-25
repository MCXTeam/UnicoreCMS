import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDefined, IsEnum, IsInt, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { DeliveryMode } from 'unicore-common';
import { QueryInput } from '../online/dto/query.input';
import { RconInput } from './rcon.input';
import { ServerInstanceInput } from './server-instance.input';
import { ServerTableInput } from './server-table.input';
import { NAME_MAX_LENGTH, SanitizeHtml, SERVER_INSTANCES_MAX, SERVER_MODS_MAX, SERVER_TABLE_MAX_ROWS, TEXT_MAX_LENGTH } from '@common';

export class ServerUpdateInput {
  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @IsDefined()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  version: string;

  @IsOptional()
  @IsString()
  @MaxLength(TEXT_MAX_LENGTH)
  slogan: string;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  description: string;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  content: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => QueryInput)
  query: QueryInput;

  @IsOptional()
  @IsEnum(DeliveryMode)
  delivery_mode?: DeliveryMode;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  wipe?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => RconInput)
  rcon?: RconInput;

  @IsDefined()
  @IsArray()
  @ArrayMaxSize(SERVER_TABLE_MAX_ROWS)
  @ValidateNested({ each: true })
  @Type(() => ServerTableInput)
  table: ServerTableInput[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(SERVER_INSTANCES_MAX)
  @ValidateNested({ each: true })
  @Type(() => ServerInstanceInput)
  instances?: ServerInstanceInput[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(SERVER_MODS_MAX)
  @IsInt({ each: true })
  mods: number[];
}

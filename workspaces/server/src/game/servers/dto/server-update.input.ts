import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { DeliveryMode } from 'unicore-common';
import { ServerTable } from '../entities/server-table.entity';
import { Query } from '../online/entities/query.entity';
import { RconInput } from './rcon.input';
import { SanitizeHtml } from '@common';

export class ServerUpdateInput {
  @IsDefined()
  @IsString()
  name: string;

  @IsDefined()
  @IsString()
  version: string;

  @IsOptional()
  @IsString()
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
  @Type(() => Query)
  query: Query;

  @IsOptional()
  @IsEnum(DeliveryMode)
  delivery_mode?: DeliveryMode;

  @IsOptional()
  @ValidateNested()
  @Type(() => RconInput)
  rcon?: RconInput;

  @IsDefined()
  @IsArray()
  @Type(() => ServerTable)
  table: ServerTable[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  mods: number[];
}

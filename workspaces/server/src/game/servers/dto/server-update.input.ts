import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsInt, IsOptional, IsString } from 'class-validator';
import { ServerTable } from '../entities/server-table.entity';
import { Query } from '../online/entities/query.entity';

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
  description: string;

  @IsOptional()
  @IsString()
  content: string;

  @IsDefined()
  @Type(() => Query)
  query: Query;

  @IsDefined()
  @IsArray()
  @Type(() => ServerTable)
  table: ServerTable[];

  @IsInt({ each: true })
  mods: number[];
}

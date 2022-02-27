import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsInt, IsOptional, IsString } from 'class-validator';
import { Query } from '../online/entities/query.entity';
import { ServerTableDto } from './server-table.dto';

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
  @Type(() => ServerTableDto)
  table: ServerTableDto[];

  @IsInt({ each: true })
  mods: number[];
}

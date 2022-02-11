import { Type } from "class-transformer";
import { IsDefined, IsInt, IsOptional, IsString } from "class-validator";
import { Query } from "../online/entities/query.entity";

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

  @IsDefined()
  @Type(() => Query)
  query: Query

  @IsInt({ each: true })
  mods: number[]
}
import { IsDefined, IsOptional, IsString } from "class-validator";

export class PageInput {
  @IsDefined()
  @IsString()
  title: string

  @IsDefined()
  @IsString()
  path: string

  @IsOptional()
  @IsString()
  description: string

  @IsOptional()
  @IsString()
  content: string
}
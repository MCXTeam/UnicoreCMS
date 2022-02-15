import { IsBoolean, IsDefined, IsOptional, IsString } from "class-validator";

export class NewsInput {
  @IsDefined()
  @IsString()
  title: string;

  @IsDefined()
  @IsString()
  description: string;
}
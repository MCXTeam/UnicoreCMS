import { IsDefined, IsEnum, IsOptional, IsString } from "class-validator";
import { ConfigType } from "../config.enum";

export class ConfigInput {
  @IsDefined()
  @IsString()
  key: string

  @IsOptional()
  value: string

  @IsDefined()
  @IsEnum(ConfigType)
  type: ConfigType
}
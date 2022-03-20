import { IsDefined, IsEnum, IsString } from "class-validator";
import { ConfigType } from "../config.enum";

export class ConfigInput {
  @IsDefined()
  @IsString()
  key: string

  @IsDefined()
  @IsString()
  value: string

  @IsDefined()
  @IsEnum(ConfigType)
  type: ConfigType
}
import { IsDefined, IsOptional, IsString } from "class-validator";

export class DonateFeaturesDto {
  @IsDefined()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;
}

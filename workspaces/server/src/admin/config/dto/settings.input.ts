import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class SettingsChangeInput {
  @IsString()
  key: string;

  @IsOptional()
  @IsString()
  value: string | null;

  @IsOptional()
  @IsString()
  expected: string | null;
}

export class SettingsInput {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => SettingsChangeInput)
  changes: SettingsChangeInput[];
}

import { IsDefined, IsOptional, IsString } from 'class-validator';

export class GroupKitInput {
  @IsDefined()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;
}

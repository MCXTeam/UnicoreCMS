import { IsArray, IsDefined, IsString } from 'class-validator';

export class ApiInput {
  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  perms: string[];

  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  allow: string[];
}

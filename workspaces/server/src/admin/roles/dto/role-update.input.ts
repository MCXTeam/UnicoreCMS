import { IsArray, IsDefined, IsInt, IsString } from 'class-validator';

export class RoleUpdateInput {
  @IsDefined()
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  perms: string[];

  @IsDefined()
  @IsInt()
  priority: number;
}

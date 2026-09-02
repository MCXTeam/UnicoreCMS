import { IsDefined, IsString } from 'class-validator';
import { IsStrongPassword } from '@common';

export class PasswordUpdateInput {
  @IsDefined()
  @IsString()
  @IsStrongPassword()
  password: string;
}

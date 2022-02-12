import { IsUsernameOrEmail } from '@common';
import { IsDefined } from 'class-validator';

export class LoginInput {
  @IsUsernameOrEmail()
  username_or_email: string;

  @IsDefined()
  password: string;
}

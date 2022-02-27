import { IsUsernameOrEmail } from '@common';
import { IsDefined } from 'class-validator';

export class ResetInput {
  @IsDefined()
  @IsUsernameOrEmail()
  username_or_email: string;
}

import { IsDefined, IsEmail } from 'class-validator';

export class PasswordLinkInput {
  @IsDefined()
  @IsEmail()
  email: string;
}

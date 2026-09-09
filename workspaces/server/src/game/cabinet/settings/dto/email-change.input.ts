import { IsDefined, IsEmail } from 'class-validator';

export class EmailChangeInput {
  @IsDefined()
  @IsEmail()
  email: string;
}

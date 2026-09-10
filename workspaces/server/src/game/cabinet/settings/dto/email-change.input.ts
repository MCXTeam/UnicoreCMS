import { IsDefined, IsEmail, IsString } from 'class-validator';

export class EmailChangeInput {
  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsString()
  password: string;
}

import { IsDefined, IsEmail } from "class-validator";

export class TestEmailInput {
  @IsDefined()
  @IsEmail()
  email: string
}
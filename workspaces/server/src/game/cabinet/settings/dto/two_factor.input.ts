import { IsDefined, IsString } from "class-validator";

export class TwoFactorInput {
  @IsDefined()
  @IsString()
  code: string
}
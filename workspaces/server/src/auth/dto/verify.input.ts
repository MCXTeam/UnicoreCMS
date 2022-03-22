import { IsDefined, IsString } from 'class-validator';

export class VerifyInput {
  @IsDefined()
  @IsString()
  code: string;
}

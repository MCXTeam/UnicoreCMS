import { IsDefined, IsString } from 'class-validator';

export class TokenInput {
  @IsDefined()
  @IsString()
  token: string;
}

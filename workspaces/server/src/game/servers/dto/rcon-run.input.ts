import { IsDefined, IsString } from 'class-validator';

export class RconRunInput {
  @IsDefined()
  @IsString()
  command: string;
}

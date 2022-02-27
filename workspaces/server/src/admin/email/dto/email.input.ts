import { IsDefined, IsString } from 'class-validator';

export class EmailInput {
  @IsDefined()
  @IsString()
  title: string;

  @IsDefined()
  @IsString()
  content: string;
}

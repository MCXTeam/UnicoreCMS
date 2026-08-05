import { IsDefined, IsString } from 'class-validator';

export class PagePathInput {
  @IsDefined()
  @IsString()
  path: string;
}

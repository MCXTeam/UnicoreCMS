import { Type } from 'class-transformer';
import { IsDefined, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { IsUsername } from '@common';

export class GravitSessionUser {
  @IsDefined()
  @IsUsername()
  username: string;
}

export class GravitDeleteSession {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GravitSessionUser)
  user?: GravitSessionUser;
}

export class GravitExitUser {
  @IsDefined()
  @IsUsername()
  username: string;
}

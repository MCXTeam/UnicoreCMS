import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdatesInput {
  @IsOptional() @IsUUID() id?: string;
  @IsOptional() @IsString() @MaxLength(80) release?: string;
  @IsOptional() @IsString() @MaxLength(64) fingerprint?: string;
  @IsOptional() @IsString() @MaxLength(64) hash?: string;
  @IsOptional() @IsString() @MaxLength(250) path?: string;
  @IsOptional() @IsIn(['local', 'target', 'manual', 'delete']) choice?: string;
  @IsOptional() @IsString() @MaxLength(1048576) text?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(3) @IsIn(['server', 'client', 'admin'], { each: true }) selected?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(3) @IsIn(['server', 'client', 'admin'], { each: true }) components?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) @MaxLength(120, { each: true }) extensions?: string[];
}

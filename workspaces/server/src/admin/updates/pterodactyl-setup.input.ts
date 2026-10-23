import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class PterodactylSetupInput {
  @IsIn(['inspect', 'apply']) action!: 'inspect' | 'apply';
  @IsString() @MaxLength(2048) url!: string;
  @IsString() @Matches(/^[a-zA-Z0-9_-]{8,64}$/) server!: string;
  @IsString() @Matches(/^[\w.-]{16,512}$/) token!: string;
  @IsOptional() @IsString() @MaxLength(64) fingerprint?: string;
}

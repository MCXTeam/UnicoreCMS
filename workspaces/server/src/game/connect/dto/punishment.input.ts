import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ConnectIdentityInput } from './connect.input';

export class PunishmentSubjectInput {
  @IsIn(['PLAYER', 'IP', 'CIDR'])
  kind: 'PLAYER' | 'IP' | 'CIDR';

  @IsString()
  @MaxLength(128)
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  value: string;
}

export class PunishmentScopeInput {
  @IsOptional()
  @IsUUID()
  instanceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  serverId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  networkId?: string;
}

export class PunishmentActorInput {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsUUID()
  uuid?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsBoolean()
  console: boolean;
}

export class PunishmentInput {
  @IsString()
  @MaxLength(256)
  id: string;

  @IsString()
  @MaxLength(64)
  providerId: string;

  @IsString()
  @MaxLength(256)
  externalId: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => PunishmentSubjectInput)
  subject: PunishmentSubjectInput;

  @IsIn(['BAN', 'MUTE', 'WARN', 'KICK', 'JAIL'])
  kind: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => PunishmentScopeInput)
  scope: PunishmentScopeInput;

  @IsString()
  @MaxLength(4096)
  reason: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PunishmentActorInput)
  actor?: PunishmentActorInput;

  @IsInt()
  @Min(0)
  @Max(7258118400000)
  issuedAtMs: number;

  @IsOptional()
  @IsIn(['PROVIDER', 'CONNECT', 'OBSERVED'])
  timestampSource?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7258118400000)
  expiresAtMs?: number;

  @IsIn(['ACTIVE', 'REVOKED', 'EXPIRED', 'COMPLETED'])
  status: string;

  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  revision: number;
}

export class PunishmentEventInput {
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsUUID()
  eventId: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => PunishmentInput)
  punishment: PunishmentInput;
}

export class PunishmentEventsInput extends ConnectIdentityInput {
  @IsArray()
  @ArrayMaxSize(500)
  @ArrayUnique((row: PunishmentEventInput) => row.eventId)
  @ValidateNested({ each: true })
  @Type(() => PunishmentEventInput)
  events: PunishmentEventInput[];
}

export class PunishmentPollInput extends ConnectIdentityInput {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  cursor?: string;

  @IsString()
  @MaxLength(64)
  providerId: string;
}

export class PunishmentCommandInput {
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsUUID()
  commandId: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => PunishmentInput)
  punishment: PunishmentInput;

  @IsBoolean()
  revoke: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedRevision?: number;
}

export class PunishmentResultInput {
  @IsIn(['APPLIED', 'ALREADY_APPLIED', 'UNSUPPORTED', 'FAILED', 'UNKNOWN'])
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  externalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  message?: string;
}

export class PunishmentAckInput extends ConnectIdentityInput {
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsUUID()
  commandId: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => PunishmentResultInput)
  result: PunishmentResultInput;
}

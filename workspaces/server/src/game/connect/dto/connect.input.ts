import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
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

export class ConnectIdentityInput {
  @IsString()
  @MaxLength(64)
  serverId: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsUUID()
  instanceId: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsUUID()
  bootId: string;

  @IsInt()
  @Min(0)
  @Max(2147483646)
  epoch: number;
}

export class PlayerObservationInput {
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsUUID()
  uuid: string;

  @IsString()
  @MaxLength(64)
  name: string;

  @IsIn(['ACTIVE', 'AFK', 'UNKNOWN'])
  activity: 'ACTIVE' | 'AFK' | 'UNKNOWN';

  @IsIn(['VISIBLE', 'HIDDEN', 'UNKNOWN'])
  visibility: 'VISIBLE' | 'HIDDEN' | 'UNKNOWN';
}

export class PresenceInput extends ConnectIdentityInput {
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  sequence: number;

  @IsInt()
  @Min(0)
  @Max(8640000000000000)
  observedAtMs: number;

  @IsInt()
  @Min(0)
  @Max(1000000)
  maxPlayers: number;

  @IsArray()
  @ArrayMaxSize(10000)
  @ArrayUnique((player: PlayerObservationInput) => player.uuid)
  @ValidateNested({ each: true })
  @Type(() => PlayerObservationInput)
  players: PlayerObservationInput[];
}

export class SessionCheckpointInput {
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsUUID()
  sessionId: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsUUID()
  userUuid: string;

  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  sequence: number;

  @IsInt()
  @Min(0)
  @Max(315360000000)
  connectedMs: number;

  @IsInt()
  @Min(0)
  @Max(315360000000)
  activeMs: number;

  @IsBoolean()
  closed: boolean;
}

export class SessionsInput extends ConnectIdentityInput {
  @IsArray()
  @ArrayMaxSize(1000)
  @ArrayUnique((row: SessionCheckpointInput) => row.sessionId)
  @ValidateNested({ each: true })
  @Type(() => SessionCheckpointInput)
  sessions: SessionCheckpointInput[];
}

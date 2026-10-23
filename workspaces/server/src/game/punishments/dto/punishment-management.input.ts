import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsDefined, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { ALL_KINDS } from '../punishment.model';

export class UnbanRuleInput {
  @IsOptional() @IsBoolean() enabled: boolean | null;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(1_000_000_000) price: number | null;
}

export class PunishmentMemberInput {
  @IsString() @Matches(/^[a-f0-9]{64}$/) streamId: string;
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,64}$/) providerId: string;
  @IsArray() @ArrayUnique() @ArrayMaxSize(5) @IsIn(ALL_KINDS, { each: true }) primaryKinds: string[];
}

export class PunishmentGroupInput {
  @IsString() @Matches(/^[a-zA-Z0-9_-]{1,64}$/) id: string;
  @IsString() @MaxLength(128) name: string;
  @IsArray() @ArrayUnique() @ArrayMaxSize(5) @IsIn(ALL_KINDS, { each: true }) kinds: string[];
  @IsArray() @ArrayMaxSize(250) @ValidateNested({ each: true }) @Type(() => PunishmentMemberInput) members: PunishmentMemberInput[];
  @IsDefined() @ValidateNested() @Type(() => UnbanRuleInput) unban: UnbanRuleInput;
  @IsBoolean() enabled: boolean;
  @IsInt() @Min(0) revision: number;
}

export class PunishmentIssueInput {
  @IsUUID() requestId: string;
  @IsUUID() subjectUuid: string;
  @IsIn(ALL_KINDS) kind: string;
  @IsIn(['INSTANCE', 'SERVER', 'GROUP', 'PROJECT']) scopeType: string;
  @IsOptional() @IsString() @MaxLength(64) scopeId?: string;
  @IsOptional() @IsString() @MaxLength(64) providerId?: string;
  @IsString() @MaxLength(4096) reason: string;
  @IsOptional() @IsInt() @Min(1) @Max(7258118400000) expiresAtMs?: number;
}

export class PunishmentRevisionInput {
  @IsInt() @Min(1) revision: number;
}

export class PunishmentSaleInput extends PunishmentRevisionInput {
  @IsBoolean() blocked: boolean;
  @IsOptional() @IsString() @MaxLength(4096) reason?: string;
}

export class PunishmentTransferInput extends PunishmentRevisionInput {
  @IsString() @MaxLength(64) groupId: string;
  @IsBoolean() confirm: boolean;
  @IsOptional() @IsInt() @Min(1) groupRevision?: number;
}

export class PunishmentPurchaseInput extends PunishmentRevisionInput {
  @IsUUID() requestId: string;
  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0) @Max(1_000_000_000) quotedPrice: number;
}

export class PunishmentPurchaseResolutionInput {
  @IsIn(['COMPLETE', 'REFUND']) action: string;
  @IsString() @MaxLength(4096) reason: string;
}

export class PunishmentSettingsInput {
  @IsBoolean() gameUnbanEnabled: boolean;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(1_000_000_000) gameUnbanPrice: number;
}

export class PunishmentServerRuleInput extends UnbanRuleInput {
  @IsString() @MaxLength(64) serverId: string;
}

export class PunishmentConversionInput extends PunishmentIssueInput {
  @IsInt() @Min(1) revision: number;
  @IsBoolean() confirm: boolean;
  @IsOptional() @IsString() @Matches(/^[a-f0-9]{64}$/) previewToken?: string;
}

export class PunishmentBindingInput {
  @IsString() @Matches(/^[a-f0-9]{64}$/) bindingId: string;
}

export class PunishmentVerificationInput extends PunishmentBindingInput {
  @IsString() @MaxLength(256) externalId: string;
  @IsString() @MaxLength(4096) reason: string;
}

export class PunishmentInstanceInput {
  @IsString() @MaxLength(128) displayName: string;
  @IsOptional() @IsUUID() serverInstanceId?: string;
}

export class PunishmentListInput {
  @IsOptional() @IsIn(['active', 'history']) tab?: string;
  @IsOptional() @IsIn(['GAME', 'ACCOUNT']) category?: string;
  @IsOptional() @IsIn(['INSTANCE', 'NATIVE', 'SERVER', 'GROUP', 'PROJECT', 'ACCOUNT']) scopeType?: string;
  @IsOptional() @IsString() @MaxLength(64) scopeId?: string;
  @IsOptional() @IsUUID() subjectUuid?: string;
  @IsOptional() @IsString() @MaxLength(128) search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000000) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsIn([...ALL_KINDS, 'ALL']) kind?: string;
}

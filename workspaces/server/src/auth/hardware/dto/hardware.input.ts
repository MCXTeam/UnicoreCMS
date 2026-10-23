import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBase64, IsBoolean, IsDefined, IsIn, IsInt, IsISO8601, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { binaryValue } from '../hardware-comparison';

const binaryTransform = ({ value }: { value: unknown }) => {
  if (value == null) return value;
  try { return binaryValue(value); } catch { return '!invalid'; }
};

export class HardwareInfoInput {
  @IsInt() @IsIn([0, 32, 64]) bitness = 0;
  @IsInt() @Min(0) @Max(Number.MAX_SAFE_INTEGER) totalMemory = 0;
  @IsInt() @Min(0) @Max(65536) logicalProcessors = 0;
  @IsInt() @Min(0) @Max(65536) physicalProcessors = 0;
  @IsInt() @Min(0) @Max(Number.MAX_SAFE_INTEGER) processorMaxFreq = 0;
  @IsBoolean() battery = false;
  @IsOptional() @IsString() @MaxLength(256) hwDiskId?: string;
  @IsOptional() @IsString() @MaxLength(256) baseboardSerialNumber?: string;
  @IsOptional() @IsString() @MaxLength(512) graphicCard?: string;
  @IsOptional() @Transform(binaryTransform) @IsBase64() @MaxLength(44000) displayId?: string;
}

export class HardwareInfoRequest {
  @IsDefined() @IsObject() @ValidateNested() @Type(() => HardwareInfoInput) info: HardwareInfoInput;
}

export class HardwarePublicKeyRequest {
  @Transform(binaryTransform) @IsBase64() @MinLength(24) @MaxLength(8192) publicKey: string;
}

export class HardwareCreateRequest extends HardwareInfoRequest {
  @Transform(binaryTransform) @IsBase64() @MinLength(24) @MaxLength(8192) publicKey: string;
}

export class HardwareIdRequest {
  @IsUUID() id: string;
}

export class HardwareReferenceRequest {
  @IsDefined() @IsObject() @ValidateNested() @Type(() => HardwareIdRequest) hardware: HardwareIdRequest;
}

export class HardwareConnectRequest extends HardwareReferenceRequest {
  @IsUUID() sessionID: string;
}

export class HardwareAddKeyRequest extends HardwareReferenceRequest {
  @Transform(binaryTransform) @IsBase64() @MinLength(24) @MaxLength(8192) publicKey: string;
}

export class HardwareVersionInput {
  @IsUUID() id: string;
  @IsInt() @Min(1) revision: number;
}

export class HardwareBanInput {
  @IsUUID() userUuid: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => HardwareVersionInput) devices: HardwareVersionInput[];
  @IsString() @MinLength(1) @MaxLength(2048) reason: string;
  @IsOptional() @IsISO8601({ strict: true }) expiresAt?: string | null;
}

export class HardwareRevokeInput {
  @IsUUID() banId: string;
  @IsInt() @Min(1) revision: number;
  @IsString() @MinLength(1) @MaxLength(2048) reason: string;
}

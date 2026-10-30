import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class LicenseProductInput {
  @IsIn(['module', 'theme'])
  kind: 'module' | 'theme';

  @Matches(/^[a-z][a-z0-9_]{2,31}$/)
  id: string;
}

export class LicenseActivateInput extends LicenseProductInput {
  @IsOptional()
  @Matches(/^[a-z][a-z0-9._-]{2,100}$/)
  productId?: string;

  @Matches(/^[a-z0-9][a-z0-9._-]{1,100}$/)
  releaseId: string;

  @IsOptional()
  @Matches(/^ucl1_[A-Za-z0-9_-]{43}$/)
  licenseKey?: string;

  @IsOptional()
  @Matches(/^uct1_[A-Za-z0-9_-]{43}$/)
  transferCode?: string;
}

export class LicenseTransferInput extends LicenseProductInput {
  @IsString()
  @MaxLength(299)
  targetOrigin: string;
}

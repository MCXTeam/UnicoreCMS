import { SetMetadata } from '@nestjs/common';
import { AUDIT_KEY } from '../constants';

export interface AuditRouteOptions {
  action: string;
  target?: string;
  param?: string;
  bodyParam?: string;
  meta?: string[];
}

export const Audit = (options: AuditRouteOptions) => SetMetadata(AUDIT_KEY, options);

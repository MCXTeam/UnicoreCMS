import { IsDateString, IsOptional } from 'class-validator';

export class RevenueQuery {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export interface RevenueRow {
  server: string;
  name: string;
  real: number;
  virtual: number;
  purchases: number;
  products: number;
  kits: number;
  groups: number;
  permissions: number;
}

export interface RevenueReport {
  from: string;
  to: string;
  rows: RevenueRow[];
  total: Omit<RevenueRow, 'server' | 'name'>;
}

export interface RevenueItem {
  name: string;
  type: string;
  server: string | null;
  count: number;
  real: number;
  virtual: number;
}

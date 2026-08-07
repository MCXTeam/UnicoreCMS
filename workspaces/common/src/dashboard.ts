import { Permission } from "./enums";

export const DASHBOARD_STAT_PERMISSIONS = {
  payments: Permission.AdminDashboardStatsPayments,
  purchases: Permission.AdminDashboardStatsPurchases,
  online_records: Permission.AdminDashboardStatsOnline,
  users: Permission.AdminDashboardStatsUsers,
} as const;

export type DashboardStatSection = keyof typeof DASHBOARD_STAT_PERMISSIONS;

export const DASHBOARD_STAT_SECTIONS = Object.keys(
  DASHBOARD_STAT_PERMISSIONS,
) as DashboardStatSection[];

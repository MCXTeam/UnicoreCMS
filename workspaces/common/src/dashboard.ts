import { fieldPermissions } from "./permissions/fields";

export const DASHBOARD_STAT_PERMISSIONS = fieldPermissions("dashboard");

export type DashboardStatSection =
  | "payments"
  | "purchases"
  | "online_records"
  | "users";

export const DASHBOARD_STAT_SECTIONS = Object.keys(
  DASHBOARD_STAT_PERMISSIONS,
) as DashboardStatSection[];

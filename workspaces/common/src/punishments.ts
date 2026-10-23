export type PunishmentCategory = "GAME" | "ACCOUNT";
export type PunishmentTab = "active" | "history";

export interface PunishmentScopeView {
  type: string;
  id: string | null;
  name: string;
  servers: string[];
  nativeNetworkId?: string;
  providerId?: string;
}

export interface PunishmentPurchaseView {
  id: string;
  caseId: string;
  amount: number;
  status: string;
  createdAt: string;
  resolution: string | null;
  snapshot: { reason: string; scopeType: string; scopeId: string | null; revision: number; targetBindingIds: string[] };
}

export interface PunishmentView {
  id: string;
  category: PunishmentCategory;
  kind: string;
  subjectUuid: string;
  user: { uuid: string; username: string; skin?: unknown } | null;
  actor: { uuid: string; username: string } | null;
  actorName: string | null;
  scope: PunishmentScopeView;
  reason: string;
  created: string;
  expires: string | null;
  status: string;
  desired: string;
  revision: number;
  delivery: { total: number; applied: number; pending: number; attention: number };
  quote?: { available: boolean; price: number | null; reason: string | null };
  purchase?: PunishmentPurchaseView | null;
  allowedActions?: { revoke: boolean; sale: boolean; transfer: boolean; purchases: boolean };
  saleBlocked?: boolean;
  saleBlockedReason?: string | null;
}

export interface PunishmentPage {
  data: PunishmentView[];
  meta: { currentPage: number; itemsPerPage: number; totalItems: number; totalPages: number };
  counters: { active: number; history: number };
}

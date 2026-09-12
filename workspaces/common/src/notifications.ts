export const NOTIFICATION_EVENT_NEW = "notifications/new";
export const NOTIFICATION_EVENT_STATE = "notifications/state";

export const NOTIFICATION_TYPE_MAX_LENGTH = 64;
export const NOTIFICATION_CATEGORY_MAX_LENGTH = 64;
export const NOTIFICATION_KEY_MAX_LENGTH = 190;
export const NOTIFICATION_LINK_MAX_LENGTH = 255;
export const NOTIFICATION_ICON_MAX_LENGTH = 64;

export const NOTIFICATION_PAGE_SIZE = 15;
export const NOTIFICATION_MAX_PAGE_SIZE = 50;
export const NOTIFICATION_BELL_LIMIT = 8;
export const NOTIFICATION_KEEP_PER_USER = 100;
export const NOTIFICATION_KEEP_DAYS = 90;
export const NOTIFICATION_BADGE_MAX = 99;
export const NOTIFICATION_PARAMS_MAX_LENGTH = 2000;

export const NOTIFICATION_DEFAULT_ICON = "bx bx-bell";

export type NotificationParams = Record<string, string | number>;

export const NOTIFICATION_MONEY_PARAMS = ["real", "virtual", "ingame"] as const;

export type NotificationMoneyParam = (typeof NOTIFICATION_MONEY_PARAMS)[number];

export const NOTIFICATION_DATE_PARAMS = ["until", "date"] as const;

export const isNotificationMoneyParam = (name: string): name is NotificationMoneyParam =>
  NOTIFICATION_MONEY_PARAMS.includes(name as NotificationMoneyParam);

export const isNotificationDateParam = (name: string): boolean =>
  NOTIFICATION_DATE_PARAMS.includes(name as (typeof NOTIFICATION_DATE_PARAMS)[number]);

export interface NotificationView {
  id: number;
  type: string;
  category: string;
  titleKey: string;
  bodyKey: string | null;
  params: NotificationParams | null;
  link: string | null;
  icon: string | null;
  read: boolean;
  created: string;
}

export interface NotificationFeed {
  items: NotificationView[];
  unread: number;
  total: number;
}

export interface NotificationState {
  unread: number;
}

export interface NotificationCategoryView {
  id: string;
  labelKey: string;
  hintKey: string | null;
  icon: string | null;
  moduleId: string | null;
  enabled: boolean;
}

export const notificationBadge = (unread: number): string =>
  unread > NOTIFICATION_BADGE_MAX ? `${NOTIFICATION_BADGE_MAX}+` : String(unread);

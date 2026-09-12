import { NotificationCategoryInput } from 'unicore-api';

export interface NotificationCategory extends NotificationCategoryInput {
  moduleId: string | null;
}

export const NOTIFICATION_CATEGORY_DONATE = 'donate';
export const NOTIFICATION_CATEGORY_PAYMENT = 'payment';

export const CORE_NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    id: NOTIFICATION_CATEGORY_DONATE,
    labelKey: 'notifications.cat_donate',
    hintKey: 'notifications.cat_donate_hint',
    icon: 'bx bx-crown',
    moduleId: null,
  },
  {
    id: NOTIFICATION_CATEGORY_PAYMENT,
    labelKey: 'notifications.cat_payment',
    hintKey: 'notifications.cat_payment_hint',
    icon: 'bx bx-wallet-alt',
    moduleId: null,
  },
];

const registry = new Map<string, NotificationCategory>(CORE_NOTIFICATION_CATEGORIES.map((category) => [category.id, category]));

export function registerNotificationCategory(category: NotificationCategoryInput, moduleId?: string): void {
  if (!category?.id || !category.labelKey) return;

  registry.set(category.id, { ...category, moduleId: moduleId || null });
}

export function notificationCategories(): NotificationCategory[] {
  return [...registry.values()];
}

export function notificationCategoryExists(id: string): boolean {
  return registry.has(id);
}

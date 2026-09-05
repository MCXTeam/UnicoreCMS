export const MANUAL_PAYMENT_METHOD = "manual";

export const PAYMENT_TOP_LIMIT = 20;

export const PAYMENT_STATUSES = ["waiting", "paid"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

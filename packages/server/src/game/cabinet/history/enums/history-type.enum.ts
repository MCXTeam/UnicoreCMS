export enum HistoryType {
  ProductPurchase = 'product_purchase',
  KitPurchase = 'kit_purchase',
  DonateGroupPurchase = 'donate_group_purchase',
  DonatePermissionPurchase = 'donate_permission_purchase',
  UnabnPurchase = 'unban_purchase',

  MoneyTransfer = 'money_transfer',
  RealTransfer = 'money_transfer',

  Payment = 'payment',

  PasswordChange = 'password_change',
}

export class HistoryGroupType {
  static Purchase = [
    HistoryType.DonateGroupPurchase,
    HistoryType.DonatePermissionPurchase,
    HistoryType.ProductPurchase,
    HistoryType.KitPurchase,
    HistoryType.UnabnPurchase,
  ];

  static Transfer = [HistoryType.RealTransfer, HistoryType.MoneyTransfer];
}

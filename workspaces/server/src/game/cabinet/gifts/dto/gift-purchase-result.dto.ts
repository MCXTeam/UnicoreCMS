export class GiftPurchaseResultDto {
  promocode?: string;
  recipient?: string;

  constructor(partial: Partial<GiftPurchaseResultDto>) {
    Object.assign(this, partial);
  }
}

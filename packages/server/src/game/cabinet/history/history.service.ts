import { Injectable } from '@nestjs/common';
import { User } from 'src/admin/users/entities/user.entity';
import { Period } from 'src/game/donate/entities/period.entity';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { DonatePermission } from 'src/game/donate/permissions/entities/donate-permission.entity';
import { Kit } from 'src/game/store/entities/kit.entity';
import { Product } from 'src/game/store/entities/product.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { HistoryType } from './enums/history-type.enum';

@Injectable()
export class HistoryService {
  create(type: HistoryType.ProductPurchase, user: User, product: Product);
  create(type: HistoryType.KitPurchase, user: User, product: Kit);
  create(type: HistoryType.DonateGroupPurchase, user: User, donateGroup: DonateGroup, period: Period);
  create(type: HistoryType.DonatePermissionPurchase, user: User, donatePermission: DonatePermission, period: Period);
  create(type: HistoryType.Payment, user: User, payment: Payment);
  create(type: HistoryType.MoneyTransfer | HistoryType.RealTransfer, user: User, target: User, amount: number);
  create(
    type: HistoryType,
    user: User,
    payload?: Product | Kit | DonateGroup | DonatePermission | Payment | User,
    doublePayload?: number | Period,
  ) {
    switch (type) {
      case HistoryType.ProductPurchase:
        payload = payload as Product;

        break;
      case HistoryType.KitPurchase:
        payload = payload as Kit;

        break;
      case HistoryType.DonateGroupPurchase:
        payload = payload as DonateGroup;
        doublePayload = doublePayload as Period;

        break;
      case HistoryType.DonatePermissionPurchase:
        payload = payload as DonatePermission;
        doublePayload = doublePayload as Period;

        break;
      case HistoryType.Payment:
        payload = payload as Payment;

        break;
      case HistoryType.MoneyTransfer || HistoryType.RealTransfer:
        payload = payload as User;
        doublePayload = doublePayload as number;

        break;
    }
  }
}

import { envConfig } from 'unicore-common';
import { CURRENCY_DEFAULT_DECIMALS } from '../constants';

export enum SystemCurrency {
  REAL,
  VIRTAUL,
  INGAME,
}

export class currencyUtils {
  static saleApply(price: number, sale: number = null) {
    if (sale) return price - (price / 100) * sale;
    return price;
  }

  private static decimalsFor(type: SystemCurrency): number {
    switch (type) {
      case SystemCurrency.REAL:
        return envConfig.realDecimals;
      case SystemCurrency.VIRTAUL:
        return envConfig.virtualDecimals;
      case SystemCurrency.INGAME:
        return envConfig.ingameDecimals;
    }
  }

  static round(amount: number, decimals: number = null) {
    const digits = decimals ?? CURRENCY_DEFAULT_DECIMALS;

    if (digits <= 0) return Math.round(amount);

    return Math.round(amount * Math.pow(10, digits)) / Math.pow(10, digits);
  }

  static roundUp(amount: number, decimals: number = null) {
    const digits = decimals ?? CURRENCY_DEFAULT_DECIMALS;

    if (digits <= 0) return Math.ceil(amount);

    return Math.ceil(amount * Math.pow(10, digits)) / Math.pow(10, digits);
  }

  static roundByType(amount: number, type: SystemCurrency) {
    return this.round(amount, this.decimalsFor(type));
  }

  static roundUpByType(amount: number, type: SystemCurrency) {
    return this.roundUp(amount, this.decimalsFor(type));
  }
}

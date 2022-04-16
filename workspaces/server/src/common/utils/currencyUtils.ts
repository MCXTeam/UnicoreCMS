import { envConfig } from "unicore-common"

export enum SystemCurrency {
  REAL, VIRTAUL, INGAME
}

export class currencyUtils {
  static saleApply(price: number, sale: number = null) {
    if (sale) return price - price / 100 * sale
    return price
  }

  static round(amount: number, decimals: number = null) {
    if (!decimals) decimals = 2
    if (decimals <= 0) return Math.round(amount)

    return Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  static roundByType(amount: number, type: SystemCurrency) {
    switch (type) {
      case SystemCurrency.REAL:
        return this.round(amount, envConfig.realDecimals)
      case SystemCurrency.VIRTAUL:
        return this.round(amount, envConfig.virtualDecimals)
      case SystemCurrency.INGAME:
        return this.round(amount, envConfig.ingameDecimals)
    }
  }
}
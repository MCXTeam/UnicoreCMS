import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import { PaymentSettingsService } from './payment-settings.service';

export interface RateSnapshot {
  date: string;
  fetchedAt: number;
  rates: Record<string, number>;
}

export function parseCbrRates(xml: string): RateSnapshot {
  const date = xml.match(/<ValCurs\b[^>]*\bDate="(\d{2}\.\d{2}\.\d{4})"/)?.[1];
  if (!date) throw new Error('Invalid CBR response');
  const rates: Record<string, number> = { RUB: 1 };
  for (const match of xml.matchAll(/<Valute\b[^>]*>([\s\S]*?)<\/Valute>/g)) {
    const code = match[1].match(/<CharCode>([A-Z]{3})<\/CharCode>/)?.[1];
    const nominal = Number(match[1].match(/<Nominal>(\d+)<\/Nominal>/)?.[1]);
    const value = Number(match[1].match(/<Value>([\d,]+)<\/Value>/)?.[1].replace(',', '.'));
    if (code && nominal > 0 && Number.isFinite(value) && value > 0) rates[code] = value / nominal;
  }
  if (Object.keys(rates).length < 2) throw new Error('Empty CBR response');
  return { date, fetchedAt: Date.now(), rates };
}

@Injectable()
export class ExchangeRatesService {
  private refresh: Promise<RateSnapshot> | null = null;
  constructor(private settings: PaymentSettingsService) {}

  async snapshot(force = false): Promise<RateSnapshot & { stale: boolean }> {
    const cached = await this.settings.read<RateSnapshot>('cbr', null);
    if (!force && cached && Date.now() - cached.fetchedAt < 3600000) return { ...cached, stale: false };
    if (!this.refresh) {
      this.refresh = (async () => {
        const date = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Moscow' }).format(new Date());
        const response = await axios.get('https://www.cbr.ru/scripts/XML_daily.asp', { params: { date_req: date }, responseType: 'arraybuffer', timeout: 10000, maxContentLength: 1024 * 1024 });
        const value = parseCbrRates(new TextDecoder('windows-1251').decode(response.data));
        await this.settings.write('cbr', value);
        return value;
      })().finally(() => { this.refresh = null; });
    }
    try { return { ...await this.refresh, stale: false }; }
    catch {
      if (cached && Date.now() - cached.fetchedAt < 7 * 86400000) return { ...cached, stale: true };
      throw new ServiceUnavailableException('payment_rates_unavailable');
    }
  }

  async quote(amount: number, currency: string) {
    const settings = await this.settings.rates();
    if (currency === settings.baseCurrency) return { amount, currency, rate: 1, date: new Date().toISOString().slice(0, 10), baseCurrency: settings.baseCurrency };
    const snapshot = settings.mode === 'cbr' ? await this.snapshot() : { rates: settings.manualRates, date: new Date().toISOString().slice(0, 10) };
    const base = snapshot.rates[settings.baseCurrency];
    const target = snapshot.rates[currency];
    if (!(base > 0) || !(target > 0)) throw new ServiceUnavailableException('payment_currency_unavailable');
    const rate = target / base;
    if (!Number.isFinite(rate) || rate < 1e-10 || rate >= 1e12) throw new ServiceUnavailableException('payment_currency_unavailable');
    const converted = Math.ceil((amount / rate) * 100 - 1e-8) / 100;
    if (!Number.isFinite(converted) || converted <= 0 || converted > 1e9) throw new ServiceUnavailableException();
    return { amount: converted, currency, rate, date: snapshot.date, baseCurrency: settings.baseCurrency };
  }
}

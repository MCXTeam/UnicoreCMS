import { createHash } from 'node:crypto';

export interface HardwareInfo {
  bitness: number;
  totalMemory: number;
  logicalProcessors: number;
  physicalProcessors: number;
  processorMaxFreq: number;
  battery: boolean;
  hwDiskId?: string | null;
  displayId?: string | null;
  baseboardSerialNumber?: string | null;
  graphicCard?: string | null;
}

export function binaryValue(value: unknown): string {
  if (Array.isArray(value) && value.length <= 32768 && value.every((byte) => Number.isInteger(byte) && byte >= -128 && byte <= 255)) return Buffer.from(value).toString('base64');
  if (typeof value !== 'string' || value.length > 44000 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new Error('Invalid binary value');
  return Buffer.from(value, 'base64').toString('base64');
}

export const hardwareHash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function normalizeHardware(info: HardwareInfo): HardwareInfo {
  return { ...info, hwDiskId: info.hwDiskId?.trim() || null, baseboardSerialNumber: info.baseboardSerialNumber?.trim() || null, displayId: info.displayId || null };
}

function distance(first: string, second: string): number {
  const rows = Array.from({ length: first.length + 1 }, () => Array<number>(second.length + 1).fill(0));
  for (let i = 0; i <= first.length; i++) rows[i][0] = i;
  for (let j = 0; j <= second.length; j++) rows[0][j] = j;
  for (let i = 1; i <= first.length; i++) for (let j = 1; j <= second.length; j++) {
    rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + Number(first[i - 1] !== second[j - 1]));
    if (i > 1 && j > 1 && first[i - 1] === second[j - 2] && first[i - 2] === second[j - 1]) rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + Number(first[i - 1] !== second[j - 1]));
  }
  return rows[first.length][second.length];
}

export function gravitComparison(first: HardwareInfo, second: HardwareInfo): number {
  let level = 0;
  if (first.hwDiskId != null && second.hwDiskId != null) {
    const rate = distance(first.hwDiskId.toLowerCase(), second.hwDiskId.toLowerCase());
    if (rate === 0) level += 0.99;
    else if (rate < 3) level += 0.85;
    else if (rate < (first.hwDiskId.length + second.hwDiskId.length) / 4) {
      const fraction = rate / ((first.hwDiskId.length + second.hwDiskId.length) / 2);
      if (fraction > 0 && fraction < 0.85) level += fraction;
    }
  }
  if (first.baseboardSerialNumber != null && second.baseboardSerialNumber != null) {
    const rate = distance(first.baseboardSerialNumber.toLowerCase(), second.baseboardSerialNumber.toLowerCase());
    if (rate === 0) level += 0.3;
    else if (rate < 3) level += 0.15;
  }
  if (first.displayId === second.displayId) level += 0.75;
  if (first.physicalProcessors === second.physicalProcessors && first.logicalProcessors === second.logicalProcessors) level += 0.05;
  if (first.battery !== second.battery) level -= 0.05;
  if (first.processorMaxFreq === second.processorMaxFreq) level += 0.1;
  if (first.totalMemory === second.totalMemory) level += 0.1;
  if (Math.abs(first.totalMemory - second.totalMemory) < 32 * 1024) level += 0.05;
  return level;
}

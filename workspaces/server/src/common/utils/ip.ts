import { IP_ANY_PATTERN, IPV4_MAPPED_PREFIX } from '../constants';

export function normalizeIp(ip?: string): string {
  if (!ip) return '';

  const value = ip.trim();

  return value.startsWith(IPV4_MAPPED_PREFIX) ? value.slice(IPV4_MAPPED_PREFIX.length) : value;
}

function toLong(ip: string): number | null {
  const parts = ip.split('.');

  if (parts.length !== 4) return null;

  let result = 0;

  for (const part of parts) {
    const octet = Number(part);

    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null;

    result = result * 256 + octet;
  }

  return result;
}

function matchCidr(ip: string, cidr: string): boolean {
  const [network, bits] = cidr.split('/');
  const prefix = Number(bits);

  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;

  const address = toLong(ip);
  const base = toLong(network);

  if (address === null || base === null) return false;
  if (prefix === 0) return true;

  const mask = (0xffffffff << (32 - prefix)) >>> 0;

  return (address & mask) >>> 0 === (base & mask) >>> 0;
}

export function ipMatches(ip: string, pattern: string): boolean {
  const address = normalizeIp(ip);
  const rule = normalizeIp(pattern);

  if (!address || !rule) return false;
  if (rule === IP_ANY_PATTERN) return true;
  if (rule.includes('/')) return matchCidr(address, rule);

  return address === rule;
}

export function ipAllowed(ip: string, patterns?: string[]): boolean {
  if (!patterns?.length) return false;

  return patterns.some((pattern) => ipMatches(ip, pattern));
}

export function isIpPattern(pattern: string): boolean {
  const rule = normalizeIp(pattern);

  if (!rule) return false;
  if (rule === IP_ANY_PATTERN) return true;
  if (rule.includes('/')) return matchCidr(rule.split('/')[0], rule);

  return toLong(rule) !== null || rule.includes(':');
}

import { Coin, CoinQuote, CurrencyCode } from './types';

export function rateFor(currency: CurrencyCode | string | null | undefined, fxRates: Record<string, number>) {
  if (!currency) return 1;
  return fxRates?.[currency] ?? 1;
}

export function toCurrency(usdValue: number | null | undefined, currency: CurrencyCode | string, fxRates: Record<string, number>) {
  if (usdValue === null || usdValue === undefined) return null;
  return usdValue * rateFor(currency, fxRates);
}

export function convert(amount: number | null | undefined, from: CurrencyCode | string, to: CurrencyCode | string, fxRates: Record<string, number>) {
  if (amount === null || amount === undefined) return null;
  const fromRate = rateFor(from, fxRates);
  const toRate = rateFor(to, fxRates);
  if (!fromRate || !toRate) return amount;
  return (amount / fromRate) * toRate;
}

export function formatCurrency(
  value: number | null | undefined,
  currency: CurrencyCode | string,
  fxRates: Record<string, number>,
  opts: Intl.NumberFormatOptions = {}
) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  
  // Use 10 decimal places for values less than 1, otherwise use 2
  const decimals = value < 1 ? 10 : 2;
  
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: String(currency),
    minimumFractionDigits: value < 1 ? 2 : 2,
    maximumFractionDigits: decimals,
    ...opts
  });
  return formatter.format(value);
}

export function formatCurrencyFromUsd(
  usdValue: number | null | undefined,
  currency: CurrencyCode | string,
  fxRates: Record<string, number>,
  opts: Intl.NumberFormatOptions = {}
) {
  const converted = toCurrency(usdValue, currency, fxRates);
  return formatCurrency(converted, currency, fxRates, opts);
}

export function formatNumberFromUsd(
  usdValue: number | null | undefined,
  currency: CurrencyCode | string,
  fxRates: Record<string, number>,
  maximumFractionDigits = 0
) {
  if (usdValue === null || usdValue === undefined || Number.isNaN(usdValue)) return '—';
  const converted = toCurrency(usdValue, currency, fxRates);
  if (converted === null) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits }).format(converted);
}

export function formatChange(change?: number | null) {
  if (change === null || change === undefined || Number.isNaN(change)) return '—';
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

export function sortCoinsBy(list: Coin[], sort: string) {
  const sorted = [...list];
  switch (sort) {
    case 'price':
      sorted.sort((a, b) => (b.quote?.USD?.price ?? 0) - (a.quote?.USD?.price ?? 0));
      break;
    case 'change':
      sorted.sort((a, b) => (b.quote?.USD?.percent_change_24h ?? 0) - (a.quote?.USD?.percent_change_24h ?? 0));
      break;
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      sorted.sort((a, b) => (b.quote?.USD?.market_cap ?? 0) - (a.quote?.USD?.market_cap ?? 0));
  }
  return sorted;
}

export function extractQuote(coin: Coin | undefined) {
  return coin?.quote?.USD as CoinQuote | undefined;
}

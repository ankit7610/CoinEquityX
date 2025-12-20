// Stock Types matching Crypto structure for consistency

export interface Stock {
  symbol: string;
  description: string;
  displaySymbol?: string;
  type?: string;
  currency?: string;
  // Quote data
  quote?: {
    c: number; // Current price
    h: number; // High price
    l: number; // Low price
    o: number; // Open price
    pc: number; // Previous close
    t: number; // Timestamp
    d?: number; // Change
    dp?: number; // Percent change
  };
  // Metrics
  metric?: {
    '52WeekHigh'?: number;
    '52WeekLow'?: number;
    marketCapitalization?: number;
    peRatio?: number;
    dividendYield?: number;
  };
}

export interface StockNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface StockPortfolioEntry {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  cost: number | null;
  costUsd: number | null;
  costCurrency: string | null;
}

export interface StockQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High
  l: number; // Low
  o: number; // Open
  pc: number; // Previous close
  t: number; // Timestamp
}

export interface StockMetric {
  metric: {
    '10DayAverageTradingVolume': number;
    '52WeekHigh': number;
    '52WeekLow': number;
    '52WeekHighDate': string;
    '52WeekLowDate': string;
    '52WeekPriceReturnDaily': number;
    beta: number;
    marketCapitalization: number;
    peNormalizedAnnual: number;
    dividendYieldIndicatedAnnual: number;
    [key: string]: any;
  };
  series?: any;
}

export type StockCurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'AUD' | 'CAD' | 'CHF';

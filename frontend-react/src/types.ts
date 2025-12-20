export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'INR'
  | 'JPY'
  | 'AUD'
  | 'CAD'
  | 'CHF';

export interface CoinQuote {
  price?: number;
  percent_change_24h?: number;
  percent_change_1h?: number;
  percent_change_7d?: number;
  percent_change_30d?: number;
  market_cap?: number;
  volume_24h?: number;
}

export interface Coin {
  id: number | string;
  name: string;
  symbol: string;
  cmc_rank?: number;
  quote?: Record<'USD', CoinQuote>;
  circulating_supply?: number;
}

export interface Category {
  id: string | number;
  name: string;
  title?: string;
  num_tokens?: number;
  market_cap?: number;
  volume_24h?: number;
}

export interface NewsItem {
  id?: string;
  title?: string;
  description?: string;
  url?: string;
  image_url?: string;
  source?: string;
  published_at?: string;
  published?: string;
}

export interface CoinInfo {
  description?: string;
  tags?: string[];
  urls?: Record<string, string[]>;
  slug?: string;
  logo?: string;
}

export interface CoinInfoResponse {
  data?: Record<string, CoinInfo>;
}

export interface CoinQuoteResponse {
  data?: Record<string, Coin>;
}

export interface PortfolioEntry {
  id: string | number;
  name: string;
  symbol: string;
  quantity: number;
  cost: number | null;
  costUsd?: number | null;
  costCurrency?: CurrencyCode | null;
}

export interface ApiResponse<T> {
  data?: T;
  status?: {
    error_code?: number;
    error_message?: string;
  };
}

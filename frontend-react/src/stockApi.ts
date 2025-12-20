import { Stock, StockNews, StockPortfolioEntry, StockQuote, StockMetric } from './stockTypes';
import { getCached, setCached } from './idbCache';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for all stock data

async function fetchJson<T>(
  url: string,
  ttlMs = CACHE_TTL_MS,
  useCache = true,
  headers?: HeadersInit,
  cacheKey?: string
): Promise<T> {
  const key = cacheKey || url;
  if (useCache) {
    const cached = await getCached<T>(key, ttlMs);
    if (cached) return cached;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Stock API error: ${res.status}`);
  const data = (await res.json()) as T;
  
  if (useCache) {
    await setCached(key, data);
  }
  return data;
}

export async function getStockSymbols(exchange = 'US'): Promise<Stock[]> {
  return fetchJson<Stock[]>(`/api/stock/symbols?exchange=${exchange}`);
}

export async function searchStocks(query: string): Promise<Stock[]> {
  if (!query.trim()) return [];
  return fetchJson<Stock[]>(`/api/stock/search?q=${encodeURIComponent(query)}`);
}

export async function getStockNews(): Promise<StockNews[]> {
  return fetchJson<StockNews[]>('/api/stock/news');
}

export async function getStockQuote(symbol: string): Promise<StockQuote> {
  return fetchJson<StockQuote>(`/api/stock/quote?symbol=${encodeURIComponent(symbol)}`);
}

export async function getStockMetric(symbol: string): Promise<StockMetric> {
  return fetchJson<StockMetric>(`/api/stock/metric?symbol=${encodeURIComponent(symbol)}`);
}

export async function getStockPortfolio(userId?: string): Promise<{ data: StockPortfolioEntry[] }> {
  const headers: HeadersInit = {};
  if (userId) headers['X-User-ID'] = userId;
  const cacheKey = `/api/stock/portfolio?user=${userId || 'anon'}`;
  return fetchJson<{ data: StockPortfolioEntry[] }>('/api/stock/portfolio', CACHE_TTL_MS, true, headers, cacheKey);
}

export async function saveStockPortfolio(entries: StockPortfolioEntry[], userId?: string): Promise<{ data: StockPortfolioEntry[] }> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (userId) headers['X-User-ID'] = userId;

  const res = await fetch('/api/stock/portfolio', {
    method: 'PUT',
    headers,
    body: JSON.stringify(entries)
  });
  const data = await res.json();

  // Update cache with new data
  if (res.ok) {
    const cacheKey = `/api/stock/portfolio?user=${userId || 'anon'}`;
    await setCached(cacheKey, data);
  }

  return data;
}

// Batch fetch quotes for multiple symbols
export async function getBatchQuotes(symbols: string[]): Promise<Record<string, StockQuote>> {
  const quotes: Record<string, StockQuote> = {};
  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        quotes[symbol] = await getStockQuote(symbol);
      } catch (err) {
        console.error(`Failed to fetch quote for ${symbol}:`, err);
      }
    })
  );
  return quotes;
}

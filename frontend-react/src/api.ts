import { Coin, Category, NewsItem, PortfolioEntry, ApiResponse, CoinInfoResponse, CoinQuoteResponse } from './types';
import { getCached, setCached } from './idbCache';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type CacheEntry<T> = { data: T; timestamp: number };
const memoryCache = new Map<string, CacheEntry<any>>();

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const withBase = (path: string) => `${API_BASE}${path}`;

async function fetchJson<T>(
  url: string,
  ttlMs = CACHE_TTL_MS,
  useCache = true,
  headers?: HeadersInit,
  cacheKey?: string
): Promise<T> {
  const key = cacheKey || url;
  const now = Date.now();
  const mem = useCache ? memoryCache.get(key) : undefined;
  if (mem && now - mem.timestamp <= ttlMs) return mem.data as T;

  if (useCache) {
    const idbData = await getCached<T>(key, ttlMs);
    if (idbData) {
      memoryCache.set(key, { data: idbData, timestamp: now });
      return idbData;
    }
  }

  const res = await fetch(url, { headers });
  const data = (await res.json()) as T;
  if (useCache) {
    memoryCache.set(key, { data, timestamp: now });
    void setCached(key, data);
  }
  return data;
}

export async function getListings(): Promise<ApiResponse<Coin[]>> {
  return fetchJson<ApiResponse<Coin[]>>(withBase('/api/listings'));
}

export async function getCategories(): Promise<ApiResponse<Category[]>> {
  return fetchJson<ApiResponse<Category[]>>(withBase('/api/categories?start=1'));
}

export async function getNews(): Promise<ApiResponse<NewsItem[]>> {
  return fetchJson<ApiResponse<NewsItem[]>>(withBase('/api/news?countries=us&filter_entities=true&limit=10'));
}

export async function getFx(): Promise<ApiResponse<Record<string, number>>> {
  return fetchJson<ApiResponse<Record<string, number>>>(
    withBase('/api/currency/latest?base_currency=USD'),
    CACHE_TTL_MS,
    true
  );
}

export async function getPortfolio(userId?: string): Promise<ApiResponse<PortfolioEntry[]>> {
  const headers: HeadersInit = {};
  if (userId) headers['X-User-ID'] = userId;
  const cacheKey = `${API_BASE}/api/portfolio?user=${userId || 'anon'}`;
  return fetchJson<ApiResponse<PortfolioEntry[]>>(withBase('/api/portfolio'), CACHE_TTL_MS, true, headers, cacheKey);
}

export async function savePortfolio(entries: PortfolioEntry[], userId?: string): Promise<ApiResponse<PortfolioEntry[]>> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (userId) headers['X-User-ID'] = userId;

  const res = await fetch(withBase('/api/portfolio'), {
    method: 'PUT',
    headers,
    body: JSON.stringify(entries)
  });
  const data = await res.json();
  
  // Update cache with new data
  if (res.ok) {
    const cacheKey = `${API_BASE}/api/portfolio?user=${userId || 'anon'}`;
    const now = Date.now();
    memoryCache.set(cacheKey, { data, timestamp: now });
    void setCached(cacheKey, data);
  }
  
  return data;
}

export async function getCoinInfo(id: string | number): Promise<CoinInfoResponse> {
  return fetchJson<CoinInfoResponse>(withBase(`/api/info?id=${encodeURIComponent(String(id))}`), CACHE_TTL_MS);
}

export async function getCoinQuote(id: string | number): Promise<CoinQuoteResponse> {
  return fetchJson<CoinQuoteResponse>(withBase(`/api/quote?id=${encodeURIComponent(String(id))}`), CACHE_TTL_MS);
}

export async function sendChatMessage(message: string): Promise<string> {
  const res = await fetch(withBase('/api/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMessage = (data && (data.error || data.detail)) ? String(data.error || data.detail) : 'Request failed';
    throw new Error(errorMessage);
  }
  return typeof data?.text === 'string' ? data.text : '';
}

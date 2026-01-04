import { ApiResponse, VirtualPortfolio, TradeRequest } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const withBase = (path: string) => `${API_BASE}${path}`;

export async function getVirtualPortfolio(userId?: string): Promise<ApiResponse<VirtualPortfolio>> {
    const headers: HeadersInit = {};
    if (userId) headers['X-User-ID'] = userId;

    const res = await fetch(withBase('/api/virtual-portfolio'), { headers });
    return await res.json();
}

export async function executeTrade(trade: TradeRequest, userId?: string): Promise<ApiResponse<VirtualPortfolio>> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (userId) headers['X-User-ID'] = userId;

    const res = await fetch(withBase('/api/virtual-portfolio/trade'), {
        method: 'POST',
        headers,
        body: JSON.stringify(trade)
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Trade failed');
    }

    return data;
}

export async function resetVirtualPortfolio(userId?: string): Promise<ApiResponse<VirtualPortfolio>> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (userId) headers['X-User-ID'] = userId;

    const res = await fetch(withBase('/api/virtual-portfolio/reset'), {
        method: 'POST',
        headers
    });

    return await res.json();
}

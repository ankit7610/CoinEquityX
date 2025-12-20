import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFx } from '../useFx';
import { PortfolioProvider } from '../../state/PortfolioContext';
import * as api from '../../api';

vi.mock('../../api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <PortfolioProvider>{children}</PortfolioProvider>
    </QueryClientProvider>
  );
};

describe('useFx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and return FX rates', async () => {
    const mockRates = { USD: 1, EUR: 0.85, GBP: 0.73, INR: 83 };
    vi.mocked(api.getFx).mockResolvedValue({ data: mockRates });

    const { result } = renderHook(() => useFx(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current).toEqual(mockRates);
    });
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(api.getFx).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useFx(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current).toEqual({ USD: 1 });
    });
  });

  it('should use cached data on subsequent calls', async () => {
    const mockRates = { USD: 1, EUR: 0.85 };
    vi.mocked(api.getFx).mockResolvedValue({ data: mockRates });

    const { result, rerender } = renderHook(() => useFx(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current).toEqual(mockRates);
    });

    rerender();
    expect(vi.mocked(api.getFx)).toHaveBeenCalledTimes(1);
  });
});

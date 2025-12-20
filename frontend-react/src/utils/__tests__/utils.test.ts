import { describe, it, expect } from 'vitest';
import {
  rateFor,
  toCurrency,
  convert,
  formatCurrency,
  formatCurrencyFromUsd,
  formatNumberFromUsd,
  formatChange,
  sortCoinsBy,
} from '../../utils';
import { Coin } from '../../types';

describe('Utils', () => {
  const mockFxRates = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    INR: 83,
  };

  describe('rateFor', () => {
    it('should return correct exchange rate', () => {
      expect(rateFor('USD', mockFxRates)).toBe(1);
      expect(rateFor('EUR', mockFxRates)).toBe(0.85);
      expect(rateFor('INR', mockFxRates)).toBe(83);
    });

    it('should return 1 for null or undefined currency', () => {
      expect(rateFor(null, mockFxRates)).toBe(1);
      expect(rateFor(undefined, mockFxRates)).toBe(1);
    });

    it('should return 1 for unknown currency', () => {
      expect(rateFor('XYZ', mockFxRates)).toBe(1);
    });
  });

  describe('toCurrency', () => {
    it('should convert USD to other currencies', () => {
      expect(toCurrency(100, 'EUR', mockFxRates)).toBe(85);
      expect(toCurrency(100, 'INR', mockFxRates)).toBe(8300);
    });

    it('should handle null values', () => {
      expect(toCurrency(null, 'EUR', mockFxRates)).toBe(null);
      expect(toCurrency(undefined, 'EUR', mockFxRates)).toBe(null);
    });
  });

  describe('convert', () => {
    it('should convert between currencies', () => {
      expect(convert(100, 'USD', 'EUR', mockFxRates)).toBe(85);
      expect(convert(85, 'EUR', 'USD', mockFxRates)).toBeCloseTo(100, 1);
    });

    it('should handle null amounts', () => {
      expect(convert(null, 'USD', 'EUR', mockFxRates)).toBe(null);
      expect(convert(undefined, 'USD', 'EUR', mockFxRates)).toBe(null);
    });
  });

  describe('formatCurrency', () => {
    it('should format values >= 1 with 2 decimals', () => {
      const result = formatCurrency(100.5, 'USD', mockFxRates);
      expect(result).toContain('100');
    });

    it('should format values < 1 with 10 decimals', () => {
      const result = formatCurrency(0.00001234567890, 'USD', mockFxRates);
      expect(result).toContain('0.000012345');
    });

    it('should handle null/undefined values', () => {
      expect(formatCurrency(null, 'USD', mockFxRates)).toBe('—');
      expect(formatCurrency(undefined, 'USD', mockFxRates)).toBe('—');
      expect(formatCurrency(NaN, 'USD', mockFxRates)).toBe('—');
    });
  });

  describe('formatCurrencyFromUsd', () => {
    it('should convert and format USD values', () => {
      const result = formatCurrencyFromUsd(100, 'INR', mockFxRates);
      expect(result).toContain('8,300');
    });

    it('should handle null values', () => {
      expect(formatCurrencyFromUsd(null, 'USD', mockFxRates)).toBe('—');
    });
  });

  describe('formatNumberFromUsd', () => {
    it('should format large numbers', () => {
      const result = formatNumberFromUsd(1000000, 'USD', mockFxRates, 0);
      expect(result).toContain('1,000,000');
    });

    it('should handle decimals', () => {
      const result = formatNumberFromUsd(1234.56, 'USD', mockFxRates, 2);
      expect(result).toContain('1,234.56');
    });
  });

  describe('formatChange', () => {
    it('should format positive changes', () => {
      expect(formatChange(5.25)).toBe('+5.25%');
    });

    it('should format negative changes', () => {
      expect(formatChange(-3.15)).toBe('-3.15%');
    });

    it('should handle null/undefined', () => {
      expect(formatChange(null)).toBe('—');
      expect(formatChange(undefined)).toBe('—');
    });
  });

  describe('sortCoinsBy', () => {
    const mockCoins: Coin[] = [
      {
        id: 1,
        name: 'Bitcoin',
        symbol: 'BTC',
        quote: { USD: { price: 50000, market_cap: 1000000, volume_24h: 50000, percent_change_24h: 5 } },
      },
      {
        id: 2,
        name: 'Ethereum',
        symbol: 'ETH',
        quote: { USD: { price: 3000, market_cap: 500000, volume_24h: 30000, percent_change_24h: -2 } },
      },
      {
        id: 3,
        name: 'Cardano',
        symbol: 'ADA',
        quote: { USD: { price: 1, market_cap: 300000, volume_24h: 10000, percent_change_24h: 10 } },
      },
    ];

    it('should sort by market cap (default)', () => {
      const sorted = sortCoinsBy(mockCoins, 'market_cap');
      expect(sorted[0].symbol).toBe('BTC');
      expect(sorted[1].symbol).toBe('ETH');
      expect(sorted[2].symbol).toBe('ADA');
    });

    it('should sort by price', () => {
      const sorted = sortCoinsBy(mockCoins, 'price');
      expect(sorted[0].symbol).toBe('BTC');
      expect(sorted[1].symbol).toBe('ETH');
      expect(sorted[2].symbol).toBe('ADA');
    });

    it('should sort by change', () => {
      const sorted = sortCoinsBy(mockCoins, 'change');
      expect(sorted[0].symbol).toBe('ADA');
      expect(sorted[1].symbol).toBe('BTC');
      expect(sorted[2].symbol).toBe('ETH');
    });

    it('should sort by name', () => {
      const sorted = sortCoinsBy(mockCoins, 'name');
      expect(sorted[0].symbol).toBe('BTC');
      expect(sorted[1].symbol).toBe('ADA');
      expect(sorted[2].symbol).toBe('ETH');
    });
  });
});

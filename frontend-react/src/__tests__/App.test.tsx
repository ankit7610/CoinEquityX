import { describe, it, vi, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { Coin, Category, NewsItem } from '../types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { PortfolioProvider } from '../state/PortfolioContext';

// Mock Firebase
vi.mock('../firebase', () => ({
  firebaseReady: true,
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn((callback) => {
      callback(null);
      return vi.fn();
    }),
  },
}));

vi.mock('../api', () => {
  const listings: Coin[] = [
    { 
      id: 1, 
      name: 'Bitcoin', 
      symbol: 'BTC', 
      quote: { 
        USD: { 
          price: 50000, 
          market_cap: 1_000_000_000, 
          volume_24h: 50_000_000,
          percent_change_24h: 5.5,
          percent_change_1h: 0.5,
          percent_change_7d: 10.2
        } 
      } 
    },
    { 
      id: 2, 
      name: 'Ethereum', 
      symbol: 'ETH', 
      quote: { 
        USD: { 
          price: 3000, 
          market_cap: 500_000_000, 
          volume_24h: 30_000_000,
          percent_change_24h: -2.3,
          percent_change_1h: 0.1,
          percent_change_7d: -5.5
        } 
      } 
    }
  ];
  const categories: Category[] = [
    { id: '1', name: 'DeFi', num_tokens: 150, market_cap: 100_000_000, volume_24h: 5_000_000 },
    { id: '2', name: 'Layer 1', num_tokens: 50, market_cap: 500_000_000, volume_24h: 10_000_000 }
  ];
  const news: NewsItem[] = [
    { id: 'n1', title: 'Bitcoin hits new high', description: 'BTC reaches $50k', url: 'https://example.com/1' },
    { id: 'n2', title: 'Ethereum upgrade', description: 'ETH 2.0 progress', url: 'https://example.com/2' }
  ];

  return {
    getListings: vi.fn().mockResolvedValue({ data: listings }),
    getCategories: vi.fn().mockResolvedValue({ data: categories }),
    getNews: vi.fn().mockResolvedValue({ data: news }),
    getFx: vi.fn().mockResolvedValue({ data: { USD: 1, INR: 83, EUR: 0.85, GBP: 0.73 } }),
    getPortfolio: vi.fn().mockResolvedValue({ data: [] }),
    savePortfolio: vi.fn().mockResolvedValue({ data: [] }),
    getCoinInfo: vi.fn().mockResolvedValue({ data: { description: 'Bitcoin is a cryptocurrency' } }),
    getCoinQuote: vi.fn().mockResolvedValue({ data: { price: 50000 } })
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const AppWithProviders = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PortfolioProvider>
        <App />
      </PortfolioProvider>
    </AuthProvider>
  </QueryClientProvider>
);

describe('App Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    queryClient.clear();
  });

  it('should render auth page when not logged in', async () => {
    render(<AppWithProviders />);
    await waitFor(() => {
      expect(screen.getByText(/welcome to crypto pulse/i)).toBeInTheDocument();
    });
  });

  it('should display explore tab by default', async () => {
    localStorage.setItem('test-skip-auth', 'true');
    render(<AppWithProviders />);
    const exploreTab = await screen.findByRole('tab', { name: /explore/i });
    expect(exploreTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should switch between tabs', async () => {
    localStorage.setItem('test-skip-auth', 'true');
    const user = userEvent.setup();
    render(<AppWithProviders />);

    const categoriesTab = await screen.findByRole('tab', { name: /categories/i });
    await user.click(categoriesTab);

    await waitFor(() => {
      expect(categoriesTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('should toggle theme mode', async () => {
    localStorage.setItem('test-skip-auth', 'true');
    const user = userEvent.setup();
    render(<AppWithProviders />);

    const themeButton = await screen.findByRole('button', { name: /toggle theme/i });
    await user.click(themeButton);

    expect(localStorage.getItem('theme')).toBeTruthy();
  });

  it('should change currency', async () => {
    localStorage.setItem('test-skip-auth', 'true');
    const user = userEvent.setup();
    render(<AppWithProviders />);

    const currencySelect = await screen.findByRole('combobox', { name: /select currency/i });
    await user.click(currencySelect);

    const eurOption = await screen.findByRole('option', { name: /EUR/i });
    await user.click(eurOption);

    expect(localStorage.getItem('currency')).toBe('EUR');
  });

  it('should display crypto data when loaded', async () => {
    localStorage.setItem('test-skip-auth', 'true');
    render(<AppWithProviders />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});

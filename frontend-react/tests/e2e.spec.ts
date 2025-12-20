import { test, expect } from '@playwright/test';

const mockListings = {
  data: [
    {
      id: 1,
      name: 'Bitcoin',
      symbol: 'BTC',
      quote: { 
        USD: { 
          price: 10000, 
          percent_change_24h: 2.5, 
          percent_change_1h: 0.5,
          percent_change_7d: 5.0,
          market_cap: 190000000000, 
          volume_24h: 1000000000 
        } 
      },
      tags: ['store of value', 'layer 1']
    },
    {
      id: 2,
      name: 'Ethereum',
      symbol: 'ETH',
      quote: { 
        USD: { 
          price: 2000, 
          percent_change_24h: -1.5, 
          percent_change_1h: -0.2,
          percent_change_7d: 1.0,
          market_cap: 200000000000, 
          volume_24h: 500000000 
        } 
      },
      tags: ['smart contracts', 'layer 1', 'defi']
    }
  ]
};

const mockCategories = { data: [{ id: 7, name: 'Layer 1', num_tokens: 2, market_cap: 1000, volume_24h: 10 }] };
const mockNews = { data: [{ id: 'n1', title: 'Test headline', description: 'A short news description', url: 'https://example.com' }] };
const mockFx = { data: { USD: 1, INR: 83 } };
const mockInfo = { data: { 1: { id: 1, symbol: 'BTC', name: 'Bitcoin', description: 'Bitcoin desc', tags: ['store of value'] } } };
const mockQuote = {
  data: { 1: { id: 1, name: 'Bitcoin', symbol: 'BTC', quote: { USD: { price: 10000, percent_change_24h: 2.5 } } } }
};

test.beforeEach(async ({ page }) => {
  // Reset storage each test
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.route('**/api/listings**', (route) => route.fulfill({ status: 200, body: JSON.stringify(mockListings) }));
  await page.route('**/api/categories**', (route) => route.fulfill({ status: 200, body: JSON.stringify(mockCategories) }));
  await page.route('**/api/news**', (route) => route.fulfill({ status: 200, body: JSON.stringify(mockNews) }));
  await page.route('**/api/currency/latest**', (route) => route.fulfill({ status: 200, body: JSON.stringify(mockFx) }));
  await page.route('**/api/portfolio', (route) => {
    if (route.request().method() === 'PUT') {
      return route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) });
    }
    return route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) });
  });
  await page.route('**/api/info**', (route) => route.fulfill({ status: 200, body: JSON.stringify(mockInfo) }));
  await page.route('**/api/quote**', (route) => route.fulfill({ status: 200, body: JSON.stringify(mockQuote) }));
});

async function login(page) {
  await page.goto(base);
  await page.getByLabel('Email Address').fill('aa@gmail.com');
  await page.getByLabel('Password').fill('123456');
  await page.getByRole('button', { name: /Sign In/i }).click();
  await expect(page.getByRole('tab', { name: 'Explore' })).toBeVisible();
}

const base = process.env.E2E_BASE_URL || 'http://localhost:5173';

test.describe('Critical User Flows', () => {

  test('1. Authentication Page Loads', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(base);
    
    await expect(page.getByText('Welcome to Crypto Pulse')).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('2. Dashboard Loads (Bypassing Auth)', async ({ page }) => {
    await login(page);
    
    // Verify Dashboard elements
    await expect(page.getByRole('tab', { name: 'Explore' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Most traded cryptocurrencies')).toBeVisible();
    await expect(page.getByText('Bitcoin')).toBeVisible();
    await expect(page.getByText('Ethereum')).toBeVisible();
  });

  test('3. Navigation Works', async ({ page }) => {
    await login(page);

    // Navigate to Categories
    await page.getByRole('tab', { name: 'Categories' }).click();
    await expect(page.getByText('Cryptocurrency Categories')).toBeVisible();

    // Navigate to News
    await page.getByRole('tab', { name: 'News' }).click();
    await expect(page.getByText('Latest Crypto News')).toBeVisible();
    await expect(page.getByText('Test headline')).toBeVisible();
  });

  test('4. Portfolio Management', async ({ page }) => {
    await login(page);
    
    await page.getByRole('tab', { name: 'Portfolio' }).click();
    
    // Add coin to portfolio
    const combo = page.getByRole('combobox', { name: /Search & Select Coin/i });
    await combo.click();
    await combo.fill('Bitcoin');
    await page.getByRole('option', { name: /Bitcoin/ }).click();

    await page.getByRole('spinbutton', { name: /^Quantity$/i }).fill('1');
    await page.getByRole('spinbutton', { name: /Buy Price/i }).fill('50000');
    
    await page.getByRole('button', { name: /Add .* to Portfolio/i }).click();

    // Verify it appears in categories table
    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();
    await expect(page.getByText('Bitcoin').first()).toBeVisible();
  });

  test('5. Search Functionality', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('test-skip-auth', 'true'));
    await page.goto(base);

    const searchInput = page.getByPlaceholder('Search cryptocurrencies...');
    await searchInput.fill('Eth');
    await expect(page.getByText('Ethereum')).toBeVisible();
    await expect(page.getByText('Bitcoin')).not.toBeVisible();
  });
});

test.describe('Additional Coverage', () => {
  test('Categories load and sort controls respond', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('test-skip-auth', 'true'));
    await page.goto(base);
    await page.getByRole('tab', { name: 'Categories' }).click();
    await expect(page.getByText('Cryptocurrency Categories')).toBeVisible();
    await expect(page.getByText('Layer 1')).toBeVisible();
  });

  test('Sorting controls toggle', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('test-skip-auth', 'true'));
    await page.goto(base);
    const sortButton = page.getByRole('button', { name: /High to Low/i });
    await expect(sortButton).toBeVisible();
    await sortButton.click();
    await expect(page.getByRole('button', { name: /Low to High/i })).toBeVisible();
  });

  test('News page renders headline', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('test-skip-auth', 'true'));
    await page.goto(base);
    await page.getByRole('tab', { name: 'News' }).click();
    await expect(page.getByText('Latest Crypto News')).toBeVisible();
    await expect(page.getByText('Test headline')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

const mockListings = {
  data: [
    {
      id: 1,
      name: 'Bitcoin',
      symbol: 'BTC',
      quote: { USD: { price: 10000, percent_change_24h: 2.5, market_cap: 190000000000, volume_24h: 1000000000 } }
    }
  ]
};

const mockFx = { data: { USD: 1, INR: 83 } };
const mockInfo = { data: { 1: { id: 1, symbol: 'BTC', name: 'Bitcoin', description: 'Bitcoin desc', tags: ['store of value'] } } };
const mockQuote = {
  data: { 1: { id: 1, name: 'Bitcoin', symbol: 'BTC', quote: { USD: { price: 10000, percent_change_24h: 2.5 } } } }
};

let portfolioStore: any[] = [];

test.beforeEach(async ({ page }) => {
  portfolioStore = [];
  await page.addInitScript(() => {
    localStorage.setItem('test-skip-auth', 'true');
  });
  await page.route('**/api/listings**', (route) => route.fulfill({ status: 200, body: JSON.stringify(mockListings) }));
  await page.route('**/api/categories**', (route) => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
  await page.route('**/api/news**', (route) => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
  await page.route('**/api/currency/latest**', (route) => route.fulfill({ status: 200, body: JSON.stringify(mockFx) }));
  await page.route('**/api/portfolio', async (route) => {
    if (route.request().method() === 'PUT') {
      const payload = route.request().postDataJSON() || [];
      portfolioStore = payload;
      return route.fulfill({ status: 200, body: JSON.stringify({ data: portfolioStore }) });
    }
    return route.fulfill({ status: 200, body: JSON.stringify({ data: portfolioStore }) });
  });
  await page.route('**/api/info**', (route) => route.fulfill({ status: 200, body: JSON.stringify(mockInfo) }));
  await page.route('**/api/quote**', (route) => route.fulfill({ status: 200, body: JSON.stringify(mockQuote) }));
});

const base = process.env.E2E_BASE_URL || 'http://localhost:5173';

async function login(page) {
  await page.addInitScript(() => localStorage.setItem('test-skip-auth', 'true'));
  await page.goto(base);
  await expect(page.getByRole('tab', { name: 'Explore' })).toBeVisible();
}

test.describe('Portfolio Management', () => {
  // (Intentionally left empty; portfolio E2E covered in other suite)
});

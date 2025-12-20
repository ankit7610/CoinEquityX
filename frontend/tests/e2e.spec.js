// Requires @playwright/test. Start the app (e.g., `npm start`) before running: `npx playwright test`.
const { test, expect } = require('@playwright/test');

const mockListings = {
  data: [
    {
      id: 1,
      cmc_rank: 1,
      name: 'Bitcoin',
      symbol: 'BTC',
      quote: { USD: { price: 10000, percent_change_24h: 2.5, market_cap: 190000000000, volume_24h: 1000000000 } }
    }
  ]
};

const mockInfo = { data: { 1: { id: 1, symbol: 'BTC', description: 'Bitcoin desc', urls: { website: ['https://bitcoin.org'] } } } };
const mockQuote = { data: { 1: { id: 1, name: 'Bitcoin', symbol: 'BTC', quote: { USD: { price: 10000, percent_change_24h: 2.5 } } } } };
const mockFx = { data: { USD: 1, EUR: 0.9 } };

test('dashboard renders listings and navigates to detail', async ({ page }) => {
  await page.route('**/api/listings**', (route) => route.fulfill({ status: 200, body: JSON.stringify(mockListings) }));
  await page.route('**/api/categories**', (route) => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
  await page.route('**/api/map**', (route) => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
  await page.route('**/api/info**', (route) => route.fulfill({ status: 200, body: JSON.stringify(mockInfo) }));
  await page.route('**/api/quote**', (route) => route.fulfill({ status: 200, body: JSON.stringify(mockQuote) }));
  await page.route('**/api/currency/latest**', (route) => route.fulfill({ status: 200, body: JSON.stringify(mockFx) }));

  const base = process.env.E2E_BASE_URL || 'http://localhost:3000';
  await page.goto(base);

  // default currency is INR
  await expect(page.locator('#currency-select')).toHaveValue('INR');

  await expect(page.getByText('Markets · Categories · Portfolio')).toBeVisible();
  await expect(page.locator('.crypto-card')).toHaveCount(1);

  await page.locator('.crypto-card').first().click();
});

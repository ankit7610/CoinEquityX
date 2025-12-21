const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createAppServer, closeMongoClient } = require('../server');

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

function createMockFetch() {
  return async (url, options = {}) => {
    const target = url.toString();
    const method = String(options?.method || 'GET').toUpperCase();
    if (target.includes('/cryptocurrency/listings/latest')) {
      return jsonResponse({ data: [{ id: 1, name: 'Bitcoin' }] });
    }
    if (target.includes('/cryptocurrency/info')) {
      return jsonResponse({ data: { 1: { id: 1, symbol: 'BTC' } } });
    }
    if (target.includes('/cryptocurrency/quotes/latest')) {
      return jsonResponse({ data: { 1: { id: 1, quote: { USD: { price: 10 } } } } });
    }
    if (target.includes('/cryptocurrency/categories')) {
      return jsonResponse({ data: [{ id: 7, name: 'Layer 1' }] });
    }
    if (target.includes('/cryptocurrency/map')) {
      return jsonResponse({ data: [{ id: 1, name: 'Bitcoin' }] });
    }
    if (target.includes('/exchange/info')) {
      return jsonResponse({ data: [{ id: 99, name: 'TestEx' }] });
    }
    if (target.includes('/fear-and-greed')) {
      return jsonResponse({ data: { score: 50 } });
    }
    if (target.includes('/latest?apikey=')) {
      return jsonResponse({ data: { USD: 1, EUR: 0.9 } });
    }
    if (target.includes('/news/all')) {
      return jsonResponse({ data: [{ id: 'n1', title: 'Test headline' }] });
    }
    if (target.includes('generativelanguage.googleapis.com') && target.includes(':generateContent')) {
      assert.equal(method, 'POST');
      return jsonResponse({
        candidates: [
          {
            content: {
              parts: [{ text: 'Hello from Gemini' }]
            }
          }
        ]
      });
    }
    return jsonResponse({ error: 'unhandled ' + target }, 404);
  };
}

async function startServer(overrides = {}) {
  const server = createAppServer({
    env: {
      CMC_API_KEY: 'test-key',
      FREE_CURRENCY_API_KEY: 'fx-key',
      MARKETAUX_API_KEY: 'news-key',
      GEMINI_API_KEY: 'gemini-key',
      MONGODB_URI: '' // Explicitly disable for tests
    },
    fetchImpl: overrides.fetchImpl || createMockFetch()
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  return { server, base };
}

let context;

beforeEach(async () => {
  context = await startServer();
});

afterEach(async () => {
  if (context?.server) context.server.close();
  await closeMongoClient();
});

test('serves the SPA index', async () => {
  const res = await fetch(context.base);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body.toLowerCase(), /<!doctype html>/);
});

test('proxies listings with mocked upstream', async () => {
  const res = await fetch(`${context.base}/api/listings`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.deepEqual(json.data, [{ id: 1, name: 'Bitcoin' }]);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
});

test('returns 400 on missing id for info', async () => {
  const res = await fetch(`${context.base}/api/info`);
  assert.equal(res.status, 400);
});

test('proxies FX rates when key provided', async () => {
  const res = await fetch(`${context.base}/api/currency/latest?base_currency=USD`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data && json.data.USD === 1);
});

test('proxies news when key provided', async () => {
  const res = await fetch(`${context.base}/api/news`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.deepEqual(json.data, [{ id: 'n1', title: 'Test headline' }]);
});

test('includes CORS headers on API responses', async () => {
  const res = await fetch(`${context.base}/api/categories`);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
  assert.equal(res.headers.get('access-control-allow-methods'), 'GET,OPTIONS,PUT,POST,DELETE');
});

test('proxies map endpoint', async () => {
  const res = await fetch(`${context.base}/api/map`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(Array.isArray(json.data));
});

test('handles portfolio GET and PUT', async () => {
  // Since we didn't provide MONGODB_URI in startServer, it should return 501.
  const res = await fetch(`${context.base}/api/portfolio`);
  assert.equal(res.status, 501);
  const json = await res.json();
  assert.match(json.error, /storage not configured/);
});

test('proxies chat to Gemini', async () => {
  const res = await fetch(`${context.base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hi' })
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.text, 'Hello from Gemini');
});
